import { useState } from 'react';
import { UserPlus, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AddMemberDialogProps {
  onAddMember: (address: string) => void;
  groupId: string;
}

export function AddMemberDialog({ onAddMember, groupId }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      onAddMember(walletAddress);
      setWalletAddress('');
      setOpen(false);
    }
  };

  // Generate QR code data for joining the group
  const qrData = JSON.stringify({
    type: 'join-group',
    groupId: groupId,
    app: 'algo-split'
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl hover:shadow-md transition-all">
          <UserPlus className="size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Add Member to Group</DialogTitle>
          <DialogDescription>
            Add members via wallet address or share QR code
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">Wallet Address</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          <TabsContent value="address">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Algorand Wallet Address</Label>
                <Input
                  id="walletAddress"
                  placeholder="ALGO..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-white/80 border-gray-200 rounded-xl"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={!walletAddress.trim()} className="bg-[#006266] hover:bg-[#004d4f] rounded-xl">
                  Add Member
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                <QRCodeSVG value={qrData} size={200} />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Share this QR code with members to let them join
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}