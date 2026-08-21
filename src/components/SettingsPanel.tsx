import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import type { AudioPreferences } from "@/game/model";

interface SettingsPanelProps {
  open: boolean;
  preferences: AudioPreferences;
  onChange: (preferences: AudioPreferences) => void;
  onClose: () => void;
}

type VolumeKey = "music" | "effects" | "voices";

export function SettingsPanel({ open, preferences, onChange, onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const setVolume = (key: VolumeKey, value: number) => onChange({ ...preferences, [key]: value });

  return (
    <Modal open={open} title={t("settings.title")} onClose={onClose}>
      <div className="settings-list">
        {(["music", "effects", "voices"] as const).map((key) => (
          <label className="range-field" key={key}>
            <span>{t(`settings.${key}`)}</span>
            <output>{Math.round(preferences[key] * 100)}%</output>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences[key]}
              onChange={(event) => setVolume(key, Number(event.target.value))}
            />
          </label>
        ))}
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={preferences.muted}
            onChange={(event) => onChange({ ...preferences, muted: event.target.checked })}
          />
          <span>{t("settings.mute")}</span>
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={preferences.captions}
            onChange={(event) => onChange({ ...preferences, captions: event.target.checked })}
          />
          <span>{t("settings.captions")}</span>
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => onChange({ ...preferences, reducedMotion: event.target.checked })}
          />
          <span>{t("settings.reducedMotion")}</span>
        </label>
        <div className="settings-language">
          <span>{t("settings.language")}</span>
          <strong>{t("app.languageName")}</strong>
          <small>{t("settings.languageHint")}</small>
        </div>
      </div>
    </Modal>
  );
}
