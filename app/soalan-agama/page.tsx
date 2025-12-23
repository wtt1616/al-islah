'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CONTOH_SOALAN = [
  'Bagaimana cara solat yang betul?',
  'Apakah syarat-syarat sah puasa?',
  'Bagaimana cara mengira zakat pendapatan?',
  'Apakah hukum meninggalkan solat?',
  'Bagaimana cara bertaubat yang diterima Allah?',
  'Apakah rukun Islam dan rukun Iman?',
];

export default function SoalanAgamaPage() {
  const [soalan, setSoalan] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soalan.trim() || soalan.length < 5) {
      setError('Sila masukkan soalan yang lengkap (minimum 5 aksara)');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: soalan,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setSoalan('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/soalan-agama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soalan: soalan,
          sejarah: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendapatkan jawapan');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.jawapan,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContohClick = (contoh: string) => {
    setSoalan(contoh);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header */}
      <div className="bg-success text-white py-3 shadow">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="bi bi-book-half me-3" style={{ fontSize: '2rem' }}></i>
              <div>
                <h4 className="mb-0 fw-bold">Soal Jawab Agama</h4>
                <small className="opacity-75">Tanyakan apa-apa soalan berkaitan agama Islam</small>
              </div>
            </div>
            <div className="d-flex gap-2">
              {messages.length > 0 && (
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={clearChat}
                >
                  <i className="bi bi-trash me-1"></i>
                  Padam Sembang
                </button>
              )}
              <Link href="/" className="btn btn-outline-light btn-sm">
                <i className="bi bi-house me-1"></i>
                Utama
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow-1 overflow-auto" style={{ paddingBottom: '200px' }}>
        <div className="container py-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-moon-stars text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              <h3 className="fw-bold text-success mb-3">Assalamualaikum</h3>
              <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                Selamat datang ke Soal Jawab Agama. Tanyakan apa-apa soalan berkaitan agama Islam
                dan dapatkan jawapan berdasarkan Al-Quran, Hadis, dan pandangan ulama.
              </p>

              {/* Example Questions */}
              <div className="mb-4">
                <p className="text-muted small mb-3">
                  <i className="bi bi-lightbulb me-1"></i>
                  Cuba tanyakan soalan seperti:
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {CONTOH_SOALAN.map((contoh, index) => (
                    <button
                      key={index}
                      className="btn btn-outline-success btn-sm"
                      onClick={() => handleContohClick(contoh)}
                    >
                      {contoh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="alert alert-warning mx-auto" style={{ maxWidth: '600px' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Peringatan:</strong> Jawapan yang diberikan adalah untuk rujukan umum sahaja.
                Untuk isu-isu yang kompleks, sila rujuk kepada mufti atau ustaz yang berkelayakan.
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`d-flex mb-4 ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 me-3">
                  <div
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <i className="bi bi-book"></i>
                  </div>
                </div>
              )}
              <div
                className={`card ${message.role === 'user' ? 'bg-success text-white' : 'bg-white'}`}
                style={{ maxWidth: '80%' }}
              >
                <div className="card-body">
                  {message.role === 'assistant' ? (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                      {message.content}
                    </div>
                  ) : (
                    <div>{message.content}</div>
                  )}
                  <div className={`small mt-2 ${message.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                    {message.timestamp.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 ms-3">
                  <div
                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <i className="bi bi-person"></i>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="d-flex justify-content-start mb-4">
              <div className="flex-shrink-0 me-3">
                <div
                  className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <i className="bi bi-book"></i>
                </div>
              </div>
              <div className="card bg-white" style={{ maxWidth: '80%' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-success me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="text-muted">Sedang mencari jawapan...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-top shadow-lg" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <div className="container py-3">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show py-2 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <textarea
                ref={textareaRef}
                className="form-control"
                placeholder="Taip soalan agama anda di sini..."
                value={soalan}
                onChange={(e) => setSoalan(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                style={{ resize: 'none' }}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-success px-4"
                disabled={loading || !soalan.trim()}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </span>
                ) : (
                  <i className="bi bi-send-fill"></i>
                )}
              </button>
            </div>
            <div className="form-text mt-2">
              <span>
                <i className="bi bi-info-circle me-1"></i>
                Tekan Enter untuk hantar, Shift+Enter untuk baris baru
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
