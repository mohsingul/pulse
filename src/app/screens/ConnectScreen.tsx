import React, { useEffect, useState } from 'react';
import { Button } from '@/app/components/Button';
import { Card } from '@/app/components/Card';
import { Plus, Hash, ArrowRightCircle, Check, X } from 'lucide-react';
import { coupleAPI, reconnectRequestsAPI } from '@/utils/api';

interface ConnectScreenProps {
  userId: string;
  onCreateCouple: () => void;
  onJoinCouple: () => void;
  onReconnect: (couple: any) => void;
}

export function ConnectScreen({ userId, onCreateCouple, onJoinCouple, onReconnect }: ConnectScreenProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [reconnectLoading, setReconnectLoading] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoryAndRequests = async () => {
      if (!userId) {
        setLoadingHistory(false);
        setLoadingRequests(false);
        return;
      }

      setLoadingHistory(true);
      setHistoryError(null);
      setLoadingRequests(true);
      setRequestsError(null);

      try {
        const historyResponse = await coupleAPI.getHistory(userId);
        setHistory(historyResponse.history || []);
      } catch (error: any) {
        console.error('Error fetching partner history:', error);
        setHistoryError('Unable to load previous partners.');
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }

      try {
        const requestsResponse = await reconnectRequestsAPI.get(userId);
        setRequests(requestsResponse.requests || []);
      } catch (error: any) {
        console.error('Error fetching reconnect requests:', error);
        setRequestsError('Unable to load reconnect requests.');
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchHistoryAndRequests();
  }, [userId]);

  const handleReconnect = async (coupleId: string) => {
    if (!userId) return;

    setReconnectLoading(coupleId);
    try {
      const response = await coupleAPI.reconnect(userId, coupleId);
      onReconnect(response.couple);
    } catch (error: any) {
      console.error('Error reconnecting to previous partner:', error);
      alert(error.message || 'Failed to reconnect with your previous partner.');
    } finally {
      setReconnectLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!userId) return;

    setReconnectLoading(requestId);
    try {
      const response = await reconnectRequestsAPI.accept(userId, requestId);
      onReconnect(response.couple);
    } catch (error: any) {
      console.error('Error accepting reconnect request:', error);
      alert(error.message || 'Unable to accept the reconnect request.');
    } finally {
      setReconnectLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!userId) return;

    setReconnectLoading(requestId);
    try {
      await reconnectRequestsAPI.decline(userId, requestId);
      setRequests(requests.filter((request) => request.requestId !== requestId));
    } catch (error: any) {
      console.error('Error declining reconnect request:', error);
      alert(error.message || 'Unable to decline the reconnect request.');
    } finally {
      setReconnectLoading(null);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Connect with Your Partner</h1>
          <p className="text-muted-foreground">
            Connect with one person only. Private by default.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">Previous Partners</h2>
            <p className="text-sm text-muted-foreground">
              Reconnect quickly to someone you were paired with before.
            </p>
          </div>

          {loadingHistory ? (
            <Card className="text-center py-6">
              <div className="w-10 h-10 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto" />
            </Card>
          ) : historyError ? (
            <Card className="text-center py-6 text-destructive">{historyError}</Card>
          ) : history.length === 0 ? (
            <Card className="text-center py-6 text-muted-foreground">
              You have no previous partners yet.
            </Card>
          ) : (
            history.map((item) => (
              <Card key={item.coupleId} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.partnerDisplayName}</p>
                    <p className="text-sm">Previously connected on {new Date(item.disconnectedAt).toLocaleDateString()}</p>
                  </div>
                  <Button
                    onClick={() => handleReconnect(item.coupleId)}
                    disabled={reconnectLoading === item.coupleId}
                    className="flex items-center space-x-2"
                  >
                    <ArrowRightCircle className="w-4 h-4" />
                    <span>{reconnectLoading === item.coupleId ? 'Reconnecting...' : 'Reconnect'}</span>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">Reconnect Requests</h2>
            <p className="text-sm text-muted-foreground">
              If someone requests to reconnect with you, you’ll see it here.
            </p>
          </div>

          {loadingRequests ? (
            <Card className="text-center py-6">
              <div className="w-10 h-10 border-4 border-[#A83FFF] border-t-transparent rounded-full animate-spin mx-auto" />
            </Card>
          ) : requestsError ? (
            <Card className="text-center py-6 text-destructive">{requestsError}</Card>
          ) : requests.length === 0 ? (
            <Card className="text-center py-6 text-muted-foreground">
              No reconnect requests at the moment.
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.requestId} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{request.requesterDisplayName} wants to reconnect.</p>
                      <p className="text-sm">Requested on {new Date(request.requestedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.requestId)}
                      disabled={reconnectLoading === request.requestId}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{reconnectLoading === request.requestId ? 'Accepting...' : 'Accept'}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeclineRequest(request.requestId)}
                      disabled={reconnectLoading === request.requestId}
                      className="flex-1 flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>{reconnectLoading === request.requestId ? 'Declining...' : 'Decline'}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
            <button
              onClick={onCreateCouple}
              className="w-full p-6 text-left space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-[image:var(--pulse-gradient)] rounded-2xl">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Create a Couple</h3>
                <p className="text-muted-foreground text-sm">
                  Generate a 6-digit code to share with your partner
                </p>
              </div>
            </button>
          </Card>

          <Card className="p-0 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
            <button
              onClick={onJoinCouple}
              className="w-full p-6 text-left space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-secondary rounded-2xl">
                  <Hash className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div className="text-2xl group-hover:scale-110 transition-transform">
                  🔗
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Join with Code</h3>
                <p className="text-muted-foreground text-sm">
                  Enter your partner's 6-digit code to connect
                </p>
              </div>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}