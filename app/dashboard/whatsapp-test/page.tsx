'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function WhatsAppTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [configured, setConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'head_imam' && session?.user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        checkConfiguration();
      }
    }
  }, [status, session, router]);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setConfigured(data.configured);
    } catch (error) {
      console.error('Error checking configuration:', error);
      setConfigured(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          phoneNumber,
          name: userName || 'Test User',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Test message sent successfully!',
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to send test message',
          details: data,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error occurred',
        details: error,
      });
    } finally {
      setTesting(false);
    }
  };

  const formatPhoneHelp = () => {
    return (
      <small className="form-text text-muted">
        Malaysian format: 0123456789 or +60123456789<br/>
        International: +1234567890
      </small>
    );
  };

  if (status === 'loading' || checkingConfig) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || (session.user?.role !== 'head_imam' && session.user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp Test Center
                </h4>
              </div>
              <div className="card-body">
                {/* Configuration Status */}
                <div className={`alert ${configured ? 'alert-success' : 'alert-warning'} mb-4`}>
                  <h5 className="alert-heading">
                    <i className={`bi ${configured ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                    Configuration Status
                  </h5>
                  {configured ? (
                    <p className="mb-0">
                      ✅ Twilio WhatsApp is properly configured and ready to use.
                    </p>
                  ) : (
                    <>
                      <p className="mb-2">
                        ⚠️ Twilio WhatsApp is not configured. Please add the following to your .env file:
                      </p>
                      <pre className="bg-dark text-light p-2 rounded">
                        <code>
                          TWILIO_ACCOUNT_SID=your_account_sid{'\n'}
                          TWILIO_AUTH_TOKEN=your_auth_token{'\n'}
                          TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
                        </code>
                      </pre>
                    </>
                  )}
                </div>

                {/* Test Message Form */}
                <form onSubmit={handleTestMessage}>
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label fw-bold">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0123456789 or +60123456789"
                      required
                      disabled={!configured}
                    />
                    {formatPhoneHelp()}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="userName" className="form-label fw-bold">
                      Recipient Name <span className="text-muted">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter recipient's name"
                      disabled={!configured}
                    />
                    <small className="form-text text-muted">
                      Used in the greeting message
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={!configured || testing}
                  >
                    {testing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending Test Message...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Send Test Message
                      </>
                    )}
                  </button>
                </form>

                {/* Test Result */}
                {testResult && (
                  <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'} mt-4`}>
                    <h5 className="alert-heading">
                      <i className={`bi ${testResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                      {testResult.success ? 'Success!' : 'Error'}
                    </h5>
                    <p className="mb-2">{testResult.message}</p>
                    {testResult.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">View Details</summary>
                        <pre className="bg-dark text-light p-2 rounded mt-2 mb-0">
                          <code>{JSON.stringify(testResult.details, null, 2)}</code>
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Testing Instructions
                  </h6>
                  <ol className="mb-0">
                    <li className="mb-2">
                      <strong>For Twilio Sandbox Testing:</strong>
                      <ul>
                        <li>Send "join &lt;code&gt;" to +1 415 523 8886 on WhatsApp</li>
                        <li>Wait for confirmation message</li>
                        <li>Then test sending messages to that number</li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong>Phone Number Format:</strong>
                      <ul>
                        <li>Malaysian numbers: 0123456789 (automatically converted to +60123456789)</li>
                        <li>International: Include country code (+1234567890)</li>
                      </ul>
                    </li>
                    <li className="mb-2">
                      <strong>Expected Message:</strong>
                      <ul>
                        <li>Bilingual greeting (English + Arabic)</li>
                        <li>Test confirmation message</li>
                        <li>iSAR system signature</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => router.push('/schedules/manage')}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    Manage Schedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.push('/dashboard')}
                  >
                    <i className="bi bi-house-door me-2"></i>
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
