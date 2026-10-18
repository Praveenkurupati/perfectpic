'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  CalendarHeart, 
  Plus, 
  Trash2, 
  Check, 
  Heart, 
  Plane, 
  Baby, 
  Cake, 
  Sparkles, 
  Bell, 
  Phone, 
  Mail, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';

interface Milestone {
  id: string;
  label: string;
  occasion: 'wedding' | 'anniversary' | 'travel' | 'baby' | 'birthday' | 'other';
  date: string; // YYYY-MM-DD
  reminderEnabled: boolean;
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'm-1',
    label: 'Our Wedding Anniversary',
    occasion: 'wedding',
    date: '2026-11-20',
    reminderEnabled: true,
  },
  {
    id: 'm-2',
    label: "Aarav's Birthday",
    occasion: 'baby',
    date: '2026-12-05',
    reminderEnabled: true,
  },
  {
    id: 'm-3',
    label: 'Annual Family Vacation',
    occasion: 'travel',
    date: '2026-08-15',
    reminderEnabled: true,
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { addresses } = useAddressStore();

  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);
  const [waReminders, setWaReminders] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Milestone Form State
  const [newLabel, setNewLabel] = useState('');
  const [newOccasion, setNewOccasion] = useState<'wedding' | 'anniversary' | 'travel' | 'baby' | 'birthday' | 'other'>('wedding');
  const [newDate, setNewDate] = useState('');

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMilestones = localStorage.getItem('pp_user_milestones');
      if (savedMilestones) {
        try {
          setMilestones(JSON.parse(savedMilestones));
        } catch {}
      }
      const savedWa = localStorage.getItem('pp_pref_wa');
      if (savedWa !== null) setWaReminders(savedWa === 'true');
      const savedEmail = localStorage.getItem('pp_pref_email');
      if (savedEmail !== null) setEmailReminders(savedEmail === 'true');
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_user_milestones', JSON.stringify(milestones));
      localStorage.setItem('pp_pref_wa', String(waReminders));
      localStorage.setItem('pp_pref_email', String(emailReminders));
    }
    showToast('✨ Preferences saved successfully!');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newDate) {
      showToast('Please enter both a label and celebration date.');
      return;
    }

    const newItem: Milestone = {
      id: `m-${Date.now()}`,
      label: newLabel.trim(),
      occasion: newOccasion,
      date: newDate,
      reminderEnabled: true,
    };

    const updated = [...milestones, newItem];
    setMilestones(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_user_milestones', JSON.stringify(updated));
    }

    setNewLabel('');
    setNewDate('');
    setShowAddForm(false);
    showToast('🎉 New celebration milestone added!');
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_user_milestones', JSON.stringify(updated));
    }
    showToast('Milestone removed.');
  };

  const handleToggleReminder = (id: string) => {
    const updated = milestones.map((m) =>
      m.id === id ? { ...m, reminderEnabled: !m.reminderEnabled } : m
    );
    setMilestones(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_user_milestones', JSON.stringify(updated));
    }
  };

  const getOccasionIcon = (occasion: string) => {
    switch (occasion) {
      case 'wedding':
      case 'anniversary':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'travel':
        return <Plane className="w-4 h-4 text-cyan-500" />;
      case 'baby':
        return <Baby className="w-4 h-4 text-purple-500" />;
      case 'birthday':
        return <Cake className="w-4 h-4 text-fuchsia-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-sm shadow-luxury-md border border-noir-900 bg-noir-900 text-cream-50 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-foil-gold" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Information */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <h2 className="font-serif text-2xl font-semibold mb-6 text-noir-900">Profile Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Name</label>
            <input 
              type="text" 
              defaultValue={user?.name || ""} 
              placeholder="Your Name"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Phone</label>
            <input 
              type="tel" 
              defaultValue={user?.phone || ""} 
              placeholder="Your Phone Number"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Email Address</label>
            <input 
              type="email" 
              defaultValue={user?.email || ""} 
              placeholder="Your Email Address"
              className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50 focus:border-foil-gold focus:outline-none text-sm text-noir-900" 
            />
          </div>
        </div>
        <button 
          onClick={handleSavePreferences}
          className="mt-6 bg-noir-900 text-cream-50 px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-950 transition-colors"
        >
          Save Changes
        </button>
      </section>

      {/* Milestones & Annual Celebrations Card */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <CalendarHeart className="w-5 h-5 text-rose-600" />
              <h2 className="font-serif text-2xl font-semibold text-noir-900">
                Milestones & Annual Celebrations
              </h2>
            </div>
            <p className="text-xs text-noir-600 mt-1 max-w-xl">
              Save your family’s annual anniversaries, birthdays, and travel traditions. We’ll notify you 30 days before each celebration with your exclusive 15% loyalty coupon code (<strong className="font-mono text-noir-900">ANNIVERSARY15</strong>) so your heirloom photobook arrives right on time.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-noir-900 border border-cream-300 hover:border-noir-900 rounded-sm hover:bg-cream-50 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Celebration'}</span>
          </button>
        </div>

        {/* Add Milestone Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddMilestone}
            className="mb-6 p-5 rounded-sm bg-cream-50 border border-cream-200 space-y-4 animate-in fade-in"
          >
            <div className="font-serif font-medium text-sm text-noir-900">
              Add a New Special Celebration
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-[11px] uppercase tracking-wider text-noir-600 font-medium mb-1.5">
                  Milestone Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5th Wedding Anniversary"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full border border-cream-300 rounded-sm p-2.5 bg-white text-xs text-noir-900 focus:border-foil-gold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-noir-600 font-medium mb-1.5">
                  Occasion Type
                </label>
                <select
                  value={newOccasion}
                  onChange={(e) => setNewOccasion(e.target.value as any)}
                  className="w-full border border-cream-300 rounded-sm p-2.5 bg-white text-xs text-noir-900 focus:border-foil-gold focus:outline-none"
                >
                  <option value="wedding">Wedding</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="travel">Annual Vacation / Trip</option>
                  <option value="baby">Baby / 1st Year</option>
                  <option value="birthday">Birthday</option>
                  <option value="other">Other Celebration</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-noir-600 font-medium mb-1.5">
                  Annual Celebration Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-cream-300 rounded-sm p-2.5 bg-white text-xs text-noir-900 focus:border-foil-gold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-noir-600 hover:text-noir-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-noir-900 text-cream-50 px-5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-950 transition-colors"
              >
                Save Milestone
              </button>
            </div>
          </form>
        )}

        {/* Milestones List */}
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-cream-300 rounded-sm bg-cream-50/50 text-noir-600 text-xs">
              No milestones added yet. Click &quot;Add Celebration&quot; to save your important dates!
            </div>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-sm border border-cream-200 bg-cream-50/50 hover:bg-cream-50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-white border border-cream-200 shadow-sm shrink-0">
                    {getOccasionIcon(milestone.occasion)}
                  </div>
                  <div>
                    <div className="font-serif font-semibold text-sm text-noir-900 flex items-center gap-2">
                      <span>{milestone.label}</span>
                      <span className="capitalize text-[10px] px-2 py-0.5 rounded-full bg-cream-200/60 text-noir-700 font-sans font-medium">
                        {milestone.occasion}
                      </span>
                    </div>
                    <div className="text-xs text-noir-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-noir-400" />
                      <span>
                        Every year on{' '}
                        {new Date(milestone.date).toLocaleDateString('en-IN', {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-cream-200">
                  <button
                    onClick={() => handleToggleReminder(milestone.id)}
                    className="flex items-center gap-1.5 text-xs text-noir-600 hover:text-noir-900 transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                        milestone.reminderEnabled
                          ? 'bg-noir-900 border-noir-900 text-white'
                          : 'border-cream-400 bg-white'
                      }`}
                    >
                      {milestone.reminderEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="text-[11px] font-medium">
                      {milestone.reminderEnabled ? 'Reminder Active' : 'Muted'}
                    </span>
                  </button>

                  <Link
                    href={`/configure?template=first-anniversary&occasion=${milestone.occasion}&promo=ANNIVERSARY15`}
                    className="text-xs font-semibold uppercase tracking-wider text-foil-gold hover:underline"
                  >
                    Create Book →
                  </Link>

                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="p-1.5 text-noir-400 hover:text-rose-600 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notification Channels Preferences */}
        <div className="mt-8 pt-6 border-t border-cream-200">
          <h3 className="font-serif text-lg font-semibold text-noir-900 mb-3">
            Milestone Notification Channels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-sm border border-cream-200 bg-white flex items-start gap-3">
              <input
                type="checkbox"
                id="wa-remind"
                checked={waReminders}
                onChange={(e) => setWaReminders(e.target.checked)}
                className="mt-1 accent-noir-900"
              />
              <label htmlFor="wa-remind" className="cursor-pointer text-xs leading-relaxed text-noir-700">
                <span className="font-semibold text-noir-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Concierge Alerts
                </span>
                Receive nostalgic milestone lookbacks and your 15% discount code on WhatsApp 30 days before your celebration.
              </label>
            </div>

            <div className="p-4 rounded-sm border border-cream-200 bg-white flex items-start gap-3">
              <input
                type="checkbox"
                id="email-remind"
                checked={emailReminders}
                onChange={(e) => setEmailReminders(e.target.checked)}
                className="mt-1 accent-noir-900"
              />
              <label htmlFor="email-remind" className="cursor-pointer text-xs leading-relaxed text-noir-700">
                <span className="font-semibold text-noir-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-600" /> Luxury Email Digest
                </span>
                Receive curated inspiration, cover design proofs, and delivery deadline countdowns directly in your inbox.
              </label>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            className="mt-4 bg-noir-900 text-cream-50 px-5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-950 transition-colors"
          >
            Update Notification Settings
          </button>
        </div>
      </section>

      {/* Saved Addresses */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-noir-900">Saved Addresses</h2>
            <p className="text-xs text-noir-500 uppercase tracking-wider mt-0.5">
              Default shipping locations for your archival prints
            </p>
          </div>
          <Link
            href="/addresses"
            className="text-xs font-semibold uppercase tracking-wider text-noir-900 border border-cream-300 hover:border-noir-900 px-3 py-1.5 rounded-sm hover:bg-cream-100 transition-colors flex items-center gap-1.5"
          >
            <MapPin size={13} />
            <span>Manage All ({addresses.length})</span>
          </Link>
        </div>
        
        {addresses.length === 0 ? (
          <div className="border border-dashed border-cream-300 rounded-sm p-6 text-center bg-cream-50/50">
            <p className="text-sm text-noir-600">No saved addresses yet.</p>
            <Link href="/addresses" className="inline-block mt-2 text-xs font-semibold text-foil-gold hover:underline">
              Add your first shipping address →
            </Link>
          </div>
        ) : (
          <div className="bg-cream-50/60 p-4 border border-cream-200 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-noir-900 uppercase">
                  {addresses.find(a => a.isDefault)?.fullName || addresses[0]?.fullName}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                  Default Address
                </span>
              </div>
              <p className="text-xs text-noir-600">
                {addresses.find(a => a.isDefault)?.addressLine1 || addresses[0]?.addressLine1},{' '}
                {addresses.find(a => a.isDefault)?.city || addresses[0]?.city},{' '}
                {addresses.find(a => a.isDefault)?.pincode || addresses[0]?.pincode}
              </p>
            </div>
            <Link
              href="/addresses"
              className="text-xs font-semibold text-noir-800 hover:text-noir-950 underline underline-offset-4 shrink-0"
            >
              Change Default →
            </Link>
          </div>
        )}
      </section>

      {/* Concierge Support */}
      <section className="bg-white p-6 md:p-8 rounded-sm shadow-luxury-xs border border-cream-200">
        <h2 className="font-serif text-2xl font-semibold mb-2 text-noir-900">Need Help?</h2>
        <p className="text-xs text-noir-600 mb-6">Having issues with your order or the editor? Reach our concierge team.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Topic</label>
            <select className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm text-noir-900">
              <option>Order Status</option>
              <option>Editor Help</option>
              <option>Quality & Printing</option>
              <option>Milestone & Anniversary Reminders</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2 text-noir-600 font-medium">Message</label>
            <textarea rows={4} className="w-full border border-cream-300 rounded-sm p-3 bg-white focus:border-foil-gold focus:outline-none text-sm text-noir-900" placeholder="How can we assist you today?"></textarea>
          </div>
          <button type="button" className="border border-noir-900 text-noir-900 px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-100 transition-colors">
            Submit Ticket
          </button>
        </form>
      </section>
    </div>
  );
}
