import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Lang = "pt" | "en";

const translations = {
  // Login
  "login.title": { pt: "Painel do Anunciante", en: "Advertiser Panel" },
  "login.email": { pt: "Email", en: "Email" },
  "login.password": { pt: "Senha", en: "Password" },
  "login.submit": { pt: "Entrar", en: "Sign In" },
  "login.error": { pt: "Email ou senha incorretos", en: "Invalid email or password" },
  "login.connecting": { pt: "Conectando...", en: "Connecting..." },

  // Dashboard
  "dash.title": { pt: "Painel do Anunciante", en: "Advertiser Dashboard" },
  "dash.logout": { pt: "Sair", en: "Logout" },
  "dash.welcome": { pt: "Bem-vindo", en: "Welcome" },

  // Real-time
  "rt.title": { pt: "Status em Tempo Real", en: "Real-Time Status" },
  "rt.activeVehicles": { pt: "Veículos Ativos", en: "Active Vehicles" },
  "rt.noVehicles": { pt: "Nenhum veículo exibindo agora", en: "No vehicles displaying now" },
  "rt.driver": { pt: "Motorista", en: "Driver" },
  "rt.vehicle": { pt: "Veículo", en: "Vehicle" },
  "rt.showing": { pt: "Exibindo", en: "Showing" },

  // Daily metrics
  "dm.title": { pt: "Métricas do Dia", en: "Today's Metrics" },
  "dm.impressions": { pt: "Impressões", en: "Impressions" },
  "dm.couponsGen": { pt: "Cupons Gerados", en: "Coupons Generated" },
  "dm.couponsVal": { pt: "Cupons Validados", en: "Coupons Validated" },
  "dm.conversion": { pt: "Taxa de Conversão", en: "Conversion Rate" },

  // History
  "hist.title": { pt: "Histórico", en: "History" },
  "hist.impressions": { pt: "Impressões por Dia", en: "Impressions per Day" },
  "hist.coupons": { pt: "Cupons: Gerados vs Validados", en: "Coupons: Generated vs Validated" },
  "hist.today": { pt: "Hoje", en: "Today" },
  "hist.7days": { pt: "7 Dias", en: "7 Days" },
  "hist.30days": { pt: "30 Dias", en: "30 Days" },

  // Active media
  "media.title": { pt: "Mídias Ativas", en: "Active Media" },
  "media.impressions": { pt: "impressões", en: "impressions" },
  "media.contract": { pt: "Contrato", en: "Contract" },
  "media.active": { pt: "Ativo", en: "Active" },
  "media.expired": { pt: "Expirado", en: "Expired" },
  "media.until": { pt: "até", en: "until" },
  "media.noMedia": { pt: "Nenhuma mídia ativa", en: "No active media" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "pt",
  toggleLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("pt");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "pt" ? "en" : "pt"));
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      return entry ? entry[lang] : key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
