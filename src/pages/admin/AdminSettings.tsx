import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    delivery_charge: 0,
    bkash_number: '',
    nagad_number: '',
    bkash_qr_url: '',
    nagad_qr_url: '',
    contact_number: '01577464706',
    bank_details: '',
    delivery_area: '',
    flat_discount_percent: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            delivery_charge: data.delivery_charge || 0,
            bkash_number: data.bkash_number || '',
            nagad_number: data.nagad_number || '',
            bkash_qr_url: data.bkash_qr_url || '',
            nagad_qr_url: data.nagad_qr_url || '',
            contact_number: data.contact_number || '01577464706',
            bank_details: data.bank_details || '',
            delivery_area: data.delivery_area || '',
            flat_discount_percent: Number(data.flat_discount_percent) || 0
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'bkash_qr_url' | 'nagad_qr_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({
        ...prev,
        [field]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store_config'), settings, { merge: true });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-cream py-12">Loading settings...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-cream mb-8 uppercase tracking-wider">Store Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-charcoal/30 border border-cream/10 p-6 space-y-6 text-left">
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">Restaurant Contact Number *</label>
            <input 
              required
              type="text" 
              className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none font-bold text-lg" 
              value={settings.contact_number} 
              onChange={e => setSettings({...settings, contact_number: e.target.value})} 
            />
            <p className="text-xs text-cream/40">Users can click to directly call or message this number on WhatsApp.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">Delivery Charge (৳)</label>
            <input 
              type="number" 
              className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none" 
              value={settings.delivery_charge} 
              onChange={e => setSettings({...settings, delivery_charge: Number(e.target.value)})} 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">Flat Discount on All Items (%)</label>
            <input 
              type="number" 
              min={0}
              max={100}
              className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none font-mono" 
              placeholder="e.g. 10 for 10% discount"
              value={settings.flat_discount_percent} 
              onChange={e => setSettings({...settings, flat_discount_percent: Math.min(100, Math.max(0, Number(e.target.value)))})} 
            />
            <p className="text-xs text-cream/40">This percentage discount will be automatically applied to all products in real-time across the app.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">Delivery Area</label>
            <textarea 
              rows={2}
              className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none" 
              value={settings.delivery_area} 
              onChange={e => setSettings({...settings, delivery_area: e.target.value})} 
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cream/5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">bKash Number</label>
                <input 
                  type="text" 
                  className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none" 
                  value={settings.bkash_number} 
                  onChange={e => setSettings({...settings, bkash_number: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-cream/50 uppercase tracking-wider">bKash Barcode / QR Code</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleFileChange(e, 'bkash_qr_url')}
                  className="w-full text-xs text-cream/60 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-ember/10 file:text-ember hover:file:bg-ember/20"
                />
                {settings.bkash_qr_url && (
                  <div className="relative w-32 h-32 border border-cream/10 bg-black/20 p-1 mt-2">
                    <img src={settings.bkash_qr_url} alt="bKash QR Preview" className="w-full h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setSettings(prev => ({ ...prev, bkash_qr_url: '' }))}
                      className="absolute top-0 right-0 bg-deep-red text-cream p-1 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-cream/70 uppercase tracking-wider">Nagad Number</label>
                <input 
                  type="text" 
                  className="w-full bg-charcoal border border-cream/20 px-4 py-3 text-cream focus:border-ember outline-none" 
                  value={settings.nagad_number} 
                  onChange={e => setSettings({...settings, nagad_number: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-cream/50 uppercase tracking-wider">Nagad Barcode / QR Code</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleFileChange(e, 'nagad_qr_url')}
                  className="w-full text-xs text-cream/60 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-ember/10 file:text-ember hover:file:bg-ember/20"
                />
                {settings.nagad_qr_url && (
                  <div className="relative w-32 h-32 border border-cream/10 bg-black/20 p-1 mt-2">
                    <img src={settings.nagad_qr_url} alt="Nagad QR Preview" className="w-full h-full object-contain" />
                    <button 
                      type="button" 
                      onClick={() => setSettings(prev => ({ ...prev, nagad_qr_url: '' }))}
                      className="absolute top-0 right-0 bg-deep-red text-cream p-1 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="bg-ember text-charcoal font-bold py-3 px-8 hover:bg-ember/90 transition-colors uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
