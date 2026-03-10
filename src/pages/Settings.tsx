import { useAppStore } from '../store/useAppStore';

export default function Settings() {
  const { user } = useAppStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-main mb-4">Account Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted">Email</label>
            <div className="mt-1 p-3 bg-forest rounded-md border border-border text-text-main">
              {user?.email || 'Loading...'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted">Timezone</label>
            <div className="mt-1 p-3 bg-forest rounded-md border border-border text-text-main">
              {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text-main mb-4">Preferences</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-text-main">Medication Tracking</h3>
            <p className="text-sm text-text-muted">Enable specific prompts for ADHD medication</p>
          </div>
          <button 
            type="button" 
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-forest ${user?.medication_tracking ? 'bg-primary' : 'bg-forest border-border'}`}
            role="switch"
            aria-checked={Boolean(user?.medication_tracking)}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user?.medication_tracking ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
