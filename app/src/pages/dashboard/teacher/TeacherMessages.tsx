import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, AlertCircle, Inbox, Send } from 'lucide-react';
import { api } from '../../../lib/api';
import { getReadableApiError } from '../../../lib/errorUtils';

interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender?: { firstName: string; lastName: string; email: string };
  receiver?: { firstName: string; lastName: string; email: string };
}

const TeacherMessages: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const fetchMessages = async (type: 'received' | 'sent') => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/messages/${type}`);
      const data = res.data;
      setMessages(data.data?.messages || []);
    } catch (err: any) {
      const message = getReadableApiError(err, 'Erreur lors du chargement');
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(tab);
  }, [tab]);

  const markAsRead = async (messageId: string) => {
    try {
      await api.put(`/api/messages/${messageId}/read`);
      fetchMessages(tab);
    } catch (err: any) {
      const message = getReadableApiError(err, 'Erreur lors de la mise à jour');
      if (message) setError(message);
    }
  };

  return (
    <div className="section">
      <div className="section-content">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/teacher')}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Mail className="w-7 h-7 text-primary-navy" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Messagerie interne</p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('received')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'received' ? 'bg-primary-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            <Inbox className="inline-block w-4 h-4 mr-2" /> Reçus
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'sent' ? 'bg-primary-navy text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            <Send className="inline-block w-4 h-4 mr-2" /> Envoyés
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun message</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {tab === 'received' ? (
                      <span>De: {msg.sender?.firstName} {msg.sender?.lastName}</span>
                    ) : (
                      <span>À: {msg.receiver?.firstName} {msg.receiver?.lastName}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{msg.subject}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{msg.content}</p>
                {tab === 'received' && !msg.isRead && (
                  <button
                    onClick={() => markAsRead(msg.id)}
                    className="mt-3 text-xs px-3 py-1 rounded-lg bg-primary-navy text-white"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMessages;
