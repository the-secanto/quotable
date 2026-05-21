import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly, useSettings } from "@/lib/store";
import { useAppStore } from "@/lib/electronStore";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => (
    <ClientOnly>
      <SettingsPage />
    </ClientOnly>
  ),
});

const thresholds = [1, 2, 4, 6, 8, 12];

function SettingsPage() {
  const { settings, update } = useSettings();
  const { rules, addRule, updateRule, deleteRule } = useAppStore();

  const handleAddRule = () => {
    addRule({
      trigger_type: 'specific_time',
      trigger_config_json: JSON.stringify({ times: ['09:00'] }),
      enabled: true
    });
  };

  return (
    <div className="px-10 py-12 max-w-3xl mx-auto pb-32">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Settings
        </p>
        <h1 className="font-serif text-4xl">Quotable's behaviour</h1>
      </header>

      <section className="glass rounded-2xl p-6 mb-8">
        <h2 className="font-serif text-xl mb-1">Inactivity threshold</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Show the overlay when you return after this much idle time.
        </p>
        <div className="flex flex-wrap gap-2">
          {thresholds.map((h) => {
            const active = settings.inactivityHours === h;
            return (
              <button
                key={h}
                onClick={() => update({ inactivityHours: h })}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {h} {h === 1 ? 'hour' : 'hours'}
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-4 mb-12">
        <Toggle
          label="Show on startup"
          description="Show a quote immediately when the app starts."
          value={settings.startupTrigger === '1'}
          onChange={(v) => update({ startupTrigger: v ? '1' : '0' })}
        />
        <Toggle
          label="Show on wake"
          description="Show a quote when your computer wakes from sleep."
          value={settings.wakeTrigger === '1'}
          onChange={(v) => update({ wakeTrigger: v ? '1' : '0' })}
        />
        <Toggle
          label="Launch at startup"
          description="Automatically start Quotable when you log in."
          value={settings.launchAtStartup === '1'}
          onChange={(v) => update({ launchAtStartup: v ? '1' : '0' })}
        />
        <Toggle
          label="Minimize to tray"
          description="Closing the window will keep the app running in the system tray."
          value={settings.minimizeToTray === '1'}
          onChange={(v) => update({ minimizeToTray: v ? '1' : '0' })}
        />
      </div>

      <header className="mb-6 flex justify-between items-center">
        <h2 className="font-serif text-2xl">Custom Schedules</h2>
        <button 
          onClick={handleAddRule}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-4">
        {rules.map(rule => (
          <RuleItem 
            key={rule.id} 
            rule={rule} 
            onUpdate={(patch) => updateRule(rule.id, patch)}
            onDelete={() => deleteRule(rule.id)}
          />
        ))}
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 glass rounded-2xl border-dashed">
            No custom schedules yet.
          </p>
        )}
      </div>
    </div>
  );
}

function RuleItem({ rule, onUpdate, onDelete }: { rule: any, onUpdate: (p: any) => void, onDelete: () => void }) {
  const config = JSON.parse(rule.trigger_config_json);
  
  return (
    <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <select 
            value={rule.trigger_type}
            onChange={(e) => onUpdate({ trigger_type: e.target.value })}
            className="bg-transparent border-none text-lg font-serif p-0 focus:ring-0 cursor-pointer"
          >
            <option value="specific_time">Specific Time</option>
            <option value="interval">Interval</option>
          </select>
          <div className={`h-2 w-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-muted'}`} />
        </div>
        
        {rule.trigger_type === 'specific_time' && (
          <div className="flex gap-2 flex-wrap">
            {config.times?.map((t: string, i: number) => (
              <input 
                key={i}
                type="time"
                value={t}
                onChange={(e) => {
                  const newTimes = [...config.times];
                  newTimes[i] = e.target.value;
                  onUpdate({ trigger_config_json: JSON.stringify({ ...config, times: newTimes }) });
                }}
                className="bg-secondary/50 rounded px-2 py-1 text-xs border-none focus:ring-1 focus:ring-primary"
              />
            ))}
          </div>
        )}

        {rule.trigger_type === 'interval' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Every</span>
            <input 
              type="number"
              min="0.1"
              step="0.1"
              value={config.hours || 1}
              onChange={(e) => onUpdate({ trigger_config_json: JSON.stringify({ ...config, hours: e.target.value }) })}
              className="bg-secondary/50 rounded w-16 px-2 py-1 text-xs border-none focus:ring-1 focus:ring-primary"
            />
            <span>hours</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate({ enabled: !rule.enabled })}
          className={`relative h-6 w-10 rounded-full transition ${
            rule.enabled ? "bg-primary" : "bg-secondary"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              rule.enabled ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <section className="glass rounded-2xl p-6 flex items-center justify-between gap-6">
      <div>
        <h2 className="font-serif text-xl mb-1">{label}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition shrink-0 ${
          value ? "bg-primary" : "bg-secondary"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </section>
  );
}
