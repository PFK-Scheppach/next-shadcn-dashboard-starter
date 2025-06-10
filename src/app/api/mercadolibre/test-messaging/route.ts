import { NextRequest, NextResponse } from 'next/server';
import { getPackMessages, sendPackMessage } from '@/lib/mercadolibre-messaging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packId = searchParams.get('packId');
    const action = searchParams.get('action') || 'messages';

    if (!packId) {
      return NextResponse.json(
        { error: 'packId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 [TEST] Testing ${action} for pack ${packId}`);

    switch (action) {
      case 'messages':
        // Test getting messages
        const messages = await getPackMessages(packId, {
          mark_as_read: false,
          limit: 10
        });

        return NextResponse.json({
          success: true,
          action: 'get_messages',
          pack_id: packId,
          data: messages,
          test_results: {
            can_get_messages: true,
            message_count: messages.messages.length,
            conversation_blocked:
              messages.conversation_status?.blocked || false,
            has_paging: !!messages.paging
          }
        });

      case 'full_test':
        // Comprehensive test
        console.log(`🧪 [TEST] Running full messaging test for pack ${packId}`);

        const testResults: any = {
          pack_id: packId,
          timestamp: new Date().toISOString(),
          tests: {}
        };

        // Test 1: Get messages
        try {
          const messagesResult = await getPackMessages(packId, {
            mark_as_read: false,
            limit: 5
          });

          testResults.tests.get_messages = {
            success: true,
            message_count: messagesResult.messages.length,
            conversation_status: messagesResult.conversation_status,
            paging: messagesResult.paging
          };
        } catch (error) {
          testResults.tests.get_messages = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }

        // Test 2: Send test message
        try {
          const testMessage = `Test message from API - ${new Date().toLocaleString()}`;

          const sendResult = await sendPackMessage({
            pack_id: packId,
            text: testMessage
          });

          testResults.tests.send_message = {
            success: true,
            message_id: sendResult.id,
            status: sendResult.status,
            message_text: testMessage
          };
        } catch (error) {
          testResults.tests.send_message = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }

        // Test 3: Verify message was sent (get messages again)
        if (testResults.tests.send_message.success) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

            const verifyResult = await getPackMessages(packId, {
              mark_as_read: false,
              limit: 10
            });

            testResults.tests.verify_message = {
              success: true,
              total_messages: verifyResult.messages.length,
              latest_message: verifyResult.messages[0] || null
            };
          } catch (error) {
            testResults.tests.verify_message = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }

        // Generate summary
        const successCount = Object.values(testResults.tests).filter(
          (test: any) => test.success
        ).length;
        const totalTests = Object.keys(testResults.tests).length;

        testResults.summary = {
          overall_success: successCount === totalTests,
          tests_passed: successCount,
          total_tests: totalTests,
          success_rate: `${Math.round((successCount / totalTests) * 100)}%`
        };

        return NextResponse.json(testResults);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: messages, full_test' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [TEST] Error in messaging test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pack_id, text, test_type } = body;

    if (!pack_id || !text) {
      return NextResponse.json(
        { error: 'pack_id and text are required' },
        { status: 400 }
      );
    }

    console.log(`🧪 [TEST] Sending test message to pack ${pack_id}`);

    const result = await sendPackMessage({
      pack_id,
      text: `[TEST ${test_type || 'MANUAL'}] ${text}`
    });

    return NextResponse.json({
      success: true,
      action: 'send_test_message',
      pack_id,
      message_data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [TEST] Error sending test message:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
