import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, DollarSign, UserPlus, QrCode, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { getUserProfile } from '../utils/usernames';

interface CreateSplitPageProps {
  onCreateSplit: (name: string, members: string[]) => void;
  connectedAddress: string;
}

export function CreateSplitPage({ onCreateSplit, connectedAddress }: CreateSplitPageProps) {
  const [splitName, setSplitName] = useState('');
  const [newMember, setNewMember] = useState('');
  const [members, setMembers] = useState<string[]>([connectedAddress]);
  const [showQR, setShowQR] = useState(false);

  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember)) {
      setMembers([...members, newMember]);
      setNewMember('');
    }
  };

  const handleRemoveMember = (address: string) => {
    if (address !== connectedAddress) {
      setMembers(members.filter(m => m !== address));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (splitName.trim() && members.length >= 2) {
      onCreateSplit(splitName, members);
    }
  };

  const qrData = JSON.stringify({
    type: 'join-split',
    splitName: splitName,
    creator: connectedAddress,
    app: 'algosplit'
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Split</h1>
        <p className="text-gray-600 dark:text-gray-400">Set up a new group to track shared expenses</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Split Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-white/20 dark:border-slate-600/30 p-6">
                  <Label htmlFor="splitName" className="flex items-center gap-2 mb-3 text-gray-900 dark:text-gray-100">
                    <DollarSign className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
                    Split Name
                  </Label>
                  <Input
                    id="splitName"
                    placeholder="e.g., Goa Trip, Hackathon Team, Club Event"
                    value={splitName}
                    onChange={(e) => setSplitName(e.target.value)}
                    className="bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-600 rounded-xl dark:text-gray-100 dark:placeholder:text-gray-500"
                    required
                  />
                </Card>
              </motion.div>

              {/* Add Participants */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-white/20 dark:border-slate-600/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="flex items-center gap-2 mb-0 text-gray-900 dark:text-gray-100">
                      <Users className="size-5 text-[#006266] dark:text-[#b2dfdb]" />
                      Participants ({members.length})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQR(true)}
                      className="gap-2 rounded-lg dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      <QrCode className="size-4" />
                      Show QR
                    </Button>
                  </div>

                  {/* Add Member Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste wallet address..."
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      className="bg-white/80 dark:bg-slate-700/80 border-gray-200 dark:border-slate-600 rounded-xl dark:text-gray-100"
                    />
                    <Button
                      type="button"
                      onClick={addMember}
                      disabled={!newMember.trim()}
                      variant="outline"
                      className="rounded-xl dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      <UserPlus className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowQR(true)}
                      variant="outline"
                      className="rounded-xl dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      <QrCode className="size-4" />
                    </Button>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2">
                    {members.map((member, index) => {
                      const isYou = member === connectedAddress;
                      return (
                        <motion.div
                          key={member}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-[#006266]/5 to-[#b2dfdb]/10 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gradient-to-br from-[#006266] to-[#00838f]" />
                            <div>
                              <p className="font-mono text-sm text-gray-900">
                                {member.substring(0, 8)}...{member.substring(member.length - 6)}
                              </p>
                              {isYou && <p className="text-xs text-[#006266]">You</p>}
                            </div>
                          </div>
                          {!isYou && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              {/* Auto-split Preview */}
              {members.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-[#006266]/5 to-[#b2dfdb]/20 border-[#006266]/10 p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Auto-Split Preview</h3>
                    <p className="text-gray-600">
                      Expenses will be divided equally among <span className="font-semibold text-[#006266]">{members.length}</span> member{members.length !== 1 ? 's' : ''}
                    </p>
                  </Card>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!splitName.trim() || members.length < 2}
                className="w-full bg-gradient-to-r from-[#006266] to-[#00838f] hover:from-[#004d4f] hover:to-[#006266] dark:from-[#b2dfdb] dark:to-[#80cbc4] dark:text-[#006266] dark:hover:from-[#80cbc4] dark:hover:to-[#4db6ac] text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Split
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-slate-700/40 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">How it works</h3>
            <div className="space-y-4">
              {[
                {
                  icon: Users,
                  title: 'Add Members',
                  description: 'Include everyone who will share expenses in this group',
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: DollarSign,
                  title: 'Track Expenses',
                  description: 'Add expenses and they\'ll be automatically split among members',
                  color: 'from-green-500 to-emerald-500'
                },
                {
                  icon: QrCode,
                  title: 'Share & Settle',
                  description: 'Share QR code to invite members and settle up on Algorand',
                  color: 'from-purple-500 to-pink-500'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex gap-4 p-4 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-700/40 dark:to-slate-700/20 backdrop-blur-sm rounded-xl"
                >
                  <div className={`p-3 bg-gradient-to-br ${item.color} rounded-xl h-fit shadow-lg`}>
                    <item.icon className="size-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* QR Code Modal */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/20">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Share Split via QR Code</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Share this code to invite members instantly
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-lg">
                <QRCodeSVG value={qrData} size={240} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Share this QR code with members to let them join instantly
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}