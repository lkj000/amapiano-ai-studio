import React, { useState } from 'react';
import { useTipping } from '@/hooks/useTipping';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Heart, DollarSign } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  postId: string;
  postTitle: string;
}

const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  postId,
  postTitle
}) => {
  const { sendTip, formatCurrency, loading } = useTipping();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');

  const predefinedAmounts = [100, 300, 500, 1000, 2000]; // in cents

  const handleAmountSelect = (cents: number) => {
    setSelectedAmount(cents);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const dollars = parseFloat(value);
    if (!isNaN(dollars) && dollars > 0) {
      setSelectedAmount(Math.round(dollars * 100));
    } else {
      setSelectedAmount(null);
    }
  };

  const handleSendTip = async () => {
    if (!selectedAmount) return;

    const success = await sendTip(recipientId, postId, selectedAmount, message);
    
    if (success) {
      // Reset form and close modal
      setSelectedAmount(null);
      setCustomAmount('');
      setMessage('');
      onClose();
    }
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Send a Tip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="text-center space-y-2">
            <h4 className="font-medium">{recipientName}</h4>
            <p className="text-sm text-muted-foreground truncate">"{postTitle}"</p>
          </div>

          {/* Predefined Amounts */}
          <div className="space-y-3">
            <Label>Choose Amount</Label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((cents) => (
                <Button
                  key={cents}
                  variant={selectedAmount === cents ? "default" : "outline"}
                  onClick={() => handleAmountSelect(cents)}
                  className="h-12"
                >
                  {formatCurrency(cents)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label>Or Enter Custom Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-10"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          {/* Selected Amount Display */}
          {selectedAmount && (
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Sending {formatCurrency(selectedAmount)}
              </Badge>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder="Say something nice to the creator..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTip}
              disabled={!selectedAmount || loading}
              className="flex-1"
            >
              {loading ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Send Tip
                </>
              )}
            </Button>
          </div>

          {/* Fee Notice */}
          <p className="text-xs text-muted-foreground text-center">
            A small processing fee may apply. Tips support creators directly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;