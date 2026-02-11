import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getUserProfile } from '../utils/usernames';

interface Member {
  id: string;
  address: string;
}

interface AddExpenseDialogProps {
  onAddExpense: (description: string, amount: number, paidBy: string) => void;
  members: Member[];
}

export function AddExpenseDialog({ onAddExpense, members }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && amount && paidBy) {
      onAddExpense(description, parseFloat(amount), paidBy);
      setDescription('');
      setAmount('');
      setPaidBy('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#006266] hover:bg-[#004d4f] rounded-xl shadow-lg hover:shadow-xl transition-all">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Split an expense equally among all group members
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Dinner, Taxi, Hotel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/80 border-gray-200 rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ALGO)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/80 border-gray-200 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paidBy" className="bg-white/80 border-gray-200 rounded-xl">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => {
                  const profile = getUserProfile(member.address);
                  return (
                    <SelectItem key={member.id} value={member.id}>
                      {profile.username} ({member.address.substring(0, 6)}...{member.address.substring(member.address.length - 4)})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/20 border border-[#006266]/10 p-4 rounded-xl">
            <p className="text-sm text-gray-900">
              <span className="font-semibold text-[#006266]">Auto-split:</span> Amount will be divided equally among {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={!description.trim() || !amount || !paidBy} className="bg-[#006266] hover:bg-[#004d4f] rounded-xl">
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}