import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem, AppSettings, SyncStatus, VehicleCategory } from "@/lib/types";
import { NewsStatusPanel } from "./NewsStatusPanel";
import { normalizeMediaUrl, resolveMediaSource } from "@/lib/media";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { TargetboardTab } from "./TargetboardTab";
import { AdvertisersTab } from "./AdvertisersTab";
import type { Advertiser } from "@/lib/types";
import { Pencil } from "lucide-react";
interface ManagementPanelProps {
  open: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  settings: AppSettings;
  syncStatus: SyncStatus;
  onAddMedia: (item: Omit<MediaItem, "id" | "order">) => Promise<void>;
  onRemoveMedia: (id: string) => Promise<void>;
  onReorderMedia: (items: MediaItem[]) => Promise<void>;
  onUpdateDuration: (id: string, duration: number) => Promise<void>;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
}

type Tab = "add" | "media" | "settings" | "targetboard" | "news" | "advertisers";

export function ManagementPanel({
  open,
  onClose,
  mediaItems,
  settings,
  onAddMedia,
  onRemoveMedia,
  onUpdateDuration,
  onSaveSettings,
}: ManagementPanelProps) {
  const [tab, setTab] = useState<Tab>("add");
  const [url, setUrl] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [localSettings, setLocalSettings] = useState(settings);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      const list: VehicleCategory[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as VehicleCategory));
      setCategories(list);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "advertisers"), (snap) => {
      const list: Advertiser[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Advertiser));
      setAdvertisers(list);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleAddCity = useCallback(() => {
    const city = cityInput.trim();
    if (!city) return;
    const current = localSettings.cities || [];
    if (current.length >= 8) return;
    if (current.some((c) => c.toLowerCase() === city.toLowerCase())) return;
    setLocalSettings((s) => ({ ...s, cities: [...(s.cities || []), city] }));
    setCityInput("");
  }, [cityInput, localSettings.cities]);

  const handleRemoveCity = useCallback((index: number) => {
    setLocalSettings((s) => ({
      ...s,
      cities: (s.cities || []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleAddUrl = useCallback(async () => {
    if (!url) return;

    const trimmedName = mediaName.trim();
    const normalizedUrl = normalizeMediaUrl(url, mediaType);

    await onAddMedia({
      name: trimmedName || `${mediaType === "video" ? "Vídeo" : "Imagem"} via URL`,
      label: trimmedName || "",
      url: normalizedUrl,
      type: mediaType,
      source: resolveMediaSource(url),
      duration: 10,
      ...(selectedAdvertiserId ? { advertiserId: selectedAdvertiserId } : {}),
    });
    setUrl("");
    setMediaName("");
    setSelectedAdvertiserId("");
  }, [url, mediaName, mediaType, onAddMedia]);

  const compressImage = useCallback((file: File, maxWidth = 1280, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        alert("Formato não suportado. Envie imagens ou vídeos.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const ext = file.name.split(".").pop() || "bin";
        const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const storageRef = ref(storage, `media/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(pct));
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        const downloadURL = await getDownloadURL(storageRef);

        await onAddMedia({
          name: file.name,
          label: "",
          url: downloadURL,
          type: isVideo ? "video" : "image",
          source: "local",
          duration: isVideo ? 0 : 10,
          ...(selectedAdvertiserId ? { advertiserId: selectedAdvertiserId } : {}),
        });
        setSelectedAdvertiserId("");
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Erro no upload. Verifique as permissões do Firebase Storage.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onAddMedia]
  );

  const handleTestWeather = async () => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(localSettings.city)}&units=metric&lang=pt_br&appid=${localSettings.weatherApiKey}`
      );
      const data = await res.json();
      if (data.main) {
        setTestResult(`✅ Clima: ${data.main.temp}°C em ${data.name}`);
      } else {
        setTestResult(`❌ Erro: ${data.message || "Resposta inválida"}`);
      }
    } catch {
      setTestResult("❌ Erro de conexão");
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  // News test removed - now handled via backend sync

  const activeAdvertisers = advertisers.filter((a) => {
    const expired = new Date(a.contractEnd) < new Date();
    return !expired || a.autoRenew;
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: "Adicionar" },
    { id: "media", label: "Mídias" },
    { id: "targetboard", label: "TARGETBOARD" },
    { id: "news", label: "Notícias" },
    { id: "advertisers", label: "Anunciantes" },
    { id: "settings", label: "Configurações" },
  ];

  const [savedCategoryKey, setSavedCategoryKey] = useState<string | null>(null);

  const toggleMediaCategory = useCallback(async (itemId: string, catId: string, currentCats: string[]) => {
    const newCats = currentCats.includes(catId)
      ? currentCats.filter((c) => c !== catId)
      : [...currentCats, catId];
    try {
      await updateDoc(doc(db, "media", itemId), { categories: newCats });
      const key = `${itemId}-${catId}`;
      setSavedCategoryKey(key);
      setTimeout(() => setSavedCategoryKey((prev) => (prev === key ? null : prev)), 1200);
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
    }
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-bold text-lg">
                A<sup className="text-neon text-sm">3</sup> Gerenciamento
              </h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl">
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-sm font-display font-medium transition-colors relative ${
                    tab === t.id ? "text-neon" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "add" && (
                <div className="space-y-6">
                  {/* Google Drive */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-display font-semibold flex items-center gap-2">
                      <span className="text-neon">📁</span> Google Drive (automático)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Configure o ID da pasta nas Configurações. Mídias serão importadas automaticamente.
                    </p>
                  </div>

                  <div className="h-px bg-border" />

                  {/* URL */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-display font-semibold flex items-center gap-2">
                      <span className="text-neon">🔗</span> URL Direta
                    </h3>
                    <input
                      type="text"
                      placeholder="Nome da mídia"
                      value={mediaName}
                      onChange={(e) => setMediaName(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
                    />
                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMediaType("image")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium border transition-colors ${
                          mediaType === "image"
                            ? "bg-neon text-primary-foreground border-neon"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Imagem
                      </button>
                      <button
                        onClick={() => setMediaType("video")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium border transition-colors ${
                          mediaType === "video"
                            ? "bg-neon text-primary-foreground border-neon"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Vídeo
                      </button>
                    </div>
                    {/* Advertiser selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-display font-medium text-muted-foreground">
                        Anunciante
                      </label>
                      <select
                        value={selectedAdvertiserId}
                        onChange={(e) => setSelectedAdvertiserId(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
                      >
                        <option value="">Sem anunciante</option>
                        {activeAdvertisers.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddUrl}
                      disabled={!url}
                      className="w-full bg-neon text-primary-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Upload */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-display font-semibold flex items-center gap-2">
                      <span className="text-neon">📤</span> Upload Direto
                    </h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border hover:border-neon/30 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors"
                    >
                      <span className="text-2xl">📤</span>
                      <span className="text-sm text-muted-foreground">
                        Arraste ou clique para selecionar
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Imagens e vídeos
                      </span>
                    </button>
                    <p className="text-[10px] text-muted-foreground bg-secondary/50 border border-border rounded-lg px-3 py-2">
                      💡 Tamanho ideal: 1280×720px (16:9) • JPG • máx 500KB • mantenha elementos importantes a 80px das bordas.
                    </p>
                    {uploading && (
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-neon rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "media" && (
                <div className="space-y-2">
                  {!mediaItems.length && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma mídia adicionada
                    </p>
                  )}
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border hover:border-neon/20 transition-colors"
                    >
                      <div className="w-16 h-10 rounded-md overflow-hidden bg-background flex-shrink-0">
                        {item.type === "image" ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            🎬
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-display font-medium px-1.5 py-0.5 rounded ${
                              item.type === "image"
                                ? "bg-neon/10 text-neon"
                                : "bg-foreground/10 text-foreground/70"
                            }`}
                          >
                            {item.type === "image" ? "IMG" : "VID"}
                          </span>
                          <span className="text-[10px] font-display font-medium px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground uppercase">
                            {item.source}
                          </span>
                        </div>
                        {/* Category tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {categories.map((cat) => {
                            const active = (item.categories || []).includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleMediaCategory(item.id, cat.id, item.categories || [])}
                                className={`text-[10px] font-display font-semibold px-2 py-1 rounded border transition-all ${
                                  active
                                    ? "bg-neon text-primary-foreground border-neon shadow-[0_0_6px_hsl(var(--neon)/0.4)]"
                                    : "bg-secondary border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                                }`}
                              >
                                {cat.name}
                                {savedCategoryKey === `${item.id}-${cat.id}` && (
                                  <span className="ml-1 text-[9px]">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {item.type === "image" && (
                        <input
                          type="number"
                          value={item.duration}
                          onChange={(e) =>
                            onUpdateDuration(item.id, parseInt(e.target.value) || 10)
                          }
                          className="w-14 bg-background border border-border rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-neon/50"
                          min={3}
                          max={120}
                          title="Duração (seg)"
                        />
                      )}
                      <button
                        onClick={() => onRemoveMedia(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tab === "targetboard" && <TargetboardTab />}

              {tab === "advertisers" && <AdvertisersTab />}

              {tab === "news" && <NewsStatusPanel />}

              {tab === "settings" && (
                <div className="space-y-4">
                  {/* Cities Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-display font-medium text-muted-foreground">
                      🌍 Cidades do Widget de Clima
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome da cidade (ex: London)"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
                      />
                      <button
                        onClick={handleAddCity}
                        disabled={!cityInput.trim() || (localSettings.cities?.length || 0) >= 8}
                        className="bg-neon text-primary-foreground font-display font-semibold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(localSettings.cities || []).map((city, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-secondary rounded-lg border border-border">
                          <span className="text-sm font-body">{city}</span>
                          <button
                            onClick={() => handleRemoveCity(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {(localSettings.cities?.length || 0)}/8 cidades • Alternam a cada 5 segundos
                    </p>
                  </div>

                  <div className="h-px bg-border" />

                  {[
                    { label: "API Key OpenWeatherMap", key: "weatherApiKey" as const, placeholder: "Sua chave da API" },
                    { label: "ID Pasta Google Drive", key: "driveFolderId" as const, placeholder: "ID da pasta" },
                    { label: "Senha do Painel", key: "password" as const, placeholder: "Mínimo 4 caracteres" },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-display font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <input
                        type={field.key === "password" ? "password" : "text"}
                        value={localSettings[field.key]}
                        onChange={(e) =>
                          setLocalSettings((s) => ({ ...s, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
                      />
                    </div>
                  ))}

                  {testResult && (
                    <div className="p-3 bg-secondary rounded-lg text-xs font-body border border-border">
                      {testResult}
                    </div>
                  )}

                  <button
                    onClick={handleTestWeather}
                    className="w-full border border-border text-foreground font-display font-medium py-2 rounded-lg text-xs hover:border-neon/30 transition-colors"
                  >
                    Testar Clima
                  </button>

                  <button
                    onClick={async () => {
                      await onSaveSettings(localSettings);
                      setTestResult("✅ Configurações salvas e sincronizadas!");
                      setTimeout(() => setTestResult(null), 3000);
                    }}
                    className="w-full bg-neon text-primary-foreground font-display font-bold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
                  >
                    Salvar e Sincronizar Todas as Telas
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
