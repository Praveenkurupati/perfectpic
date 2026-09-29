'use client';

import { useState, useEffect } from 'react';
import { useAddressStore, UserAddress } from '@/stores/useAddressStore';
import { api } from '@/lib/api';
import { 
  MapPin, 
  Plus, 
  Home, 
  Building2, 
  Camera, 
  Check, 
  Edit3, 
  Trash2, 
  Star, 
  Loader2, 
  X,
  Phone,
  Compass
} from 'lucide-react';

export default function AddressesPage() {
  const { 
    addresses, 
    loading, 
    loadAddresses, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress 
  } = useAddressStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home' as 'home' | 'office' | 'studio' | 'other',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      type: 'home',
      isDefault: addresses.length === 0,
    });
    setPincodeError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: addr.type,
      isDefault: addr.isDefault,
    });
    setPincodeError(null);
    setIsModalOpen(true);
  };

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: clean }));
    setPincodeError(null);

    if (clean.length === 6) {
      setIsLookingUpPincode(true);
      try {
        const info = await api.pincodeLookup(clean);
        if (info.city && info.state) {
          setFormData(prev => ({
            ...prev,
            city: info.city,
            state: info.state,
          }));
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setIsLookingUpPincode(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.addressLine1.trim() || !formData.pincode.trim()) {
      return;
    }

    if (editingAddress) {
      await updateAddress(editingAddress.id, formData);
    } else {
      await addAddress(formData);
    }

    setIsModalOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'office':
        return <Building2 size={13} className="text-amber-700" />;
      case 'studio':
        return <Camera size={13} className="text-purple-700" />;
      default:
        return <Home size={13} className="text-sky-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-cream-200 gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-noir-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-noir-500 uppercase tracking-wider mt-1">
            Manage your archival photobook delivery destinations PAN-India
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-noir-900 text-cream-50 hover:bg-noir-950 px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shadow-luxury-xs shrink-0"
        >
          <Plus size={15} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {loading && addresses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-6 rounded-sm border border-cream-200 shadow-sm animate-pulse space-y-3">
              <div className="h-5 bg-cream-200 rounded w-28"></div>
              <div className="h-4 bg-cream-200 rounded w-48"></div>
              <div className="h-4 bg-cream-200 rounded w-3/4"></div>
              <div className="h-4 bg-cream-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white p-12 text-center border border-dashed border-cream-300 rounded-sm">
          <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-3 text-noir-400">
            <MapPin size={24} />
          </div>
          <h3 className="font-serif text-lg font-semibold text-noir-900 mb-1">No Saved Addresses</h3>
          <p className="text-sm text-noir-500 max-w-md mx-auto mb-6">
            You don&apos;t have any saved delivery addresses yet. Add your home, studio, or office address for fast 1-click checkout.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-noir-900 text-cream-50 px-5 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-950 transition-colors"
          >
            <Plus size={14} />
            <span>Add First Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-white rounded-sm p-6 border transition-all relative flex flex-col justify-between ${
                addr.isDefault 
                  ? 'border-foil-gold shadow-luxury-sm bg-gradient-to-br from-white via-white to-amber-50/20' 
                  : 'border-cream-300 hover:border-cream-400 shadow-luxury-xs'
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cream-100 border border-cream-200 rounded-full text-[11px] font-semibold uppercase tracking-wider text-noir-800">
                      {getTypeIcon(addr.type)}
                      <span className="capitalize">{addr.type}</span>
                    </span>

                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100/80 border border-foil-gold/50 rounded-full text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        <Star size={11} className="fill-amber-500 text-amber-500" />
                        Default Shipping
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Phone */}
                <h3 className="font-serif text-lg font-semibold text-noir-950 mb-1">
                  {addr.fullName}
                </h3>
                <p className="text-xs text-noir-600 flex items-center gap-1.5 mb-3 font-mono">
                  <Phone size={12} className="text-noir-400" />
                  {addr.phone}
                </p>

                {/* Full Address Block */}
                <div className="text-sm text-noir-700 leading-relaxed mb-6 space-y-0.5">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  {addr.landmark && (
                    <p className="text-xs text-noir-500 flex items-center gap-1">
                      <Compass size={11} /> Landmark: {addr.landmark}
                    </p>
                  )}
                  <p className="font-medium text-noir-900 pt-1">
                    {addr.city}, {addr.state} — <span className="font-mono text-noir-700">{addr.pincode}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-cream-200 flex items-center justify-between gap-2 mt-auto">
                <div>
                  {!addr.isDefault ? (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-xs font-semibold text-noir-600 hover:text-noir-900 underline decoration-cream-300 underline-offset-4 hover:decoration-noir-900 transition-colors"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <Check size={13} /> Active Default
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-2 text-noir-600 hover:text-noir-900 hover:bg-cream-100 rounded-sm transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Edit Address"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove address for "${addr.fullName}"?`)) {
                        deleteAddress(addr.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Delete Address"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-cream-300 rounded-sm shadow-luxury-2xl max-w-lg w-full p-6 md:p-8 my-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-noir-400 hover:text-noir-900 transition-colors p-1"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foil-gold">
                PAN-India Delivery Logistics
              </span>
              <h3 className="font-serif text-2xl font-semibold text-noir-950 mt-0.5">
                {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Recipient's Name"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                  Address Line 1 (Flat, House No, Building, Street) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="e.g. Flat 302, Palm Grove Apts, 12th Main"
                  className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Address Line 2 (Area, Colony)
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="e.g. Indiranagar 2nd Stage"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                    placeholder="e.g. Opposite Metro Pillar 42"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Pincode *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="560038"
                      className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900 font-mono"
                    />
                    {isLookingUpPincode && (
                      <Loader2 size={14} className="animate-spin absolute right-2.5 top-3 text-foil-gold" />
                    )}
                  </div>
                  {pincodeError && <p className="text-[10px] text-red-500 mt-1">{pincodeError}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Bengaluru"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Karnataka"
                    className="w-full border border-cream-300 rounded-sm p-2.5 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  />
                </div>
              </div>

              {/* Address Type Tag Picker */}
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['home', 'office', 'studio'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                        formData.type === t 
                          ? 'bg-noir-950 text-cream-50 border-noir-950' 
                          : 'border-cream-300 text-noir-700 hover:bg-cream-100'
                      }`}
                    >
                      {getTypeIcon(t)}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Set as default checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-noir-900 border-cream-300 rounded focus:ring-foil-gold accent-noir-900"
                  />
                  <span className="text-xs text-noir-800 font-medium">
                    Set this as my default shipping address for future orders
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-cream-300 text-noir-700 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-900 transition-colors shadow-luxury-md"
                >
                  {editingAddress ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
