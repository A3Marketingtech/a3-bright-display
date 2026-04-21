import { useState, useCallback, useEffect, useRef } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { Driver, VehicleCategory } from "@/lib/types";

export function TargetboardTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [subTab, setSubTab] = useState<"drivers" | "categories">("drivers");

  // Driver form
  const [dName, setDName] = useState("");
  const [dLogin, setDLogin] = useState("");
  const [dPassword, setDPassword] = useState("");
  const [dVehicle, setDVehicle] = useState("");
  const [dVehiclePhoto, setDVehiclePhoto] = useState<File | null>(null);
  const [dVehiclePhotoPreview, setDVehiclePhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const vehiclePhotoRef = useRef<HTMLInputElement>(null);
  const [dVin, setDVin] = useState("");
  const [dCategories, setDCategories] = useState<string[]>([]);

  // Edit driver state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [eName, setEName] = useState("");
  const [eLogin, setELogin] = useState("");
  const [ePassword, setEPassword] = useState("");
  const [eVehicle, setEVehicle] = useState("");
  const [eVin, setEVin] = useState("");
  const [eCategories, setECategories] = useState<string[]>([]);
  const [eVehiclePhoto, setEVehiclePhoto] = useState<File | null>(null);
  const [eVehiclePhotoPreview, setEVehiclePhotoPreview] = useState("");
  const [eExistingPhoto, setEExistingPhoto] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  // Category form
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");

  const openEditDriver = useCallback((d: Driver) => {
    setEditingDriver(d);
    setEName(d.name || "");
    setELogin(d.login || "");
    setEPassword(d.password || "");
    setEVehicle(d.vehicle || "");
    setEVin(d.vin || "");
    const initial =
      d.categoryIds && d.categoryIds.length > 0
        ? d.categoryIds
        : d.categoryId
        ? [d.categoryId]
        : [];
    setECategories(initial);
    setEExistingPhoto(d.vehiclePhoto || "");
    setEVehiclePhoto(null);
    setEVehiclePhotoPreview("");
  }, []);

  const closeEditDriver = useCallback(() => {
    setEditingDriver(null);
    setEVehiclePhoto(null);
    setEVehiclePhotoPreview("");
    if (editPhotoRef.current) editPhotoRef.current.value = "";
  }, []);

  const saveEditDriver = useCallback(async () => {
    if (!editingDriver) return;
    if (!eName || !eLogin || !ePassword || eCategories.length === 0) return;
    setSavingEdit(true);
    try {
      let vehiclePhotoUrl = eExistingPhoto;
      if (eVehiclePhoto) {
        const ext = eVehiclePhoto.name.split(".").pop() || "jpg";
        const fileName = `vehicles/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const storageRef = ref(storage, fileName);
        await uploadBytesResumable(storageRef, eVehiclePhoto);
        vehiclePhotoUrl = await getDownloadURL(storageRef);
      }
      await setDoc(doc(db, "drivers", editingDriver.id), {
        name: eName,
        login: eLogin,
        password: ePassword,
        vehicle: eVehicle,
        vin: eVin,
        categoryIds: eCategories,
        categoryId: eCategories[0] || "",
        ...(vehiclePhotoUrl ? { vehiclePhoto: vehiclePhotoUrl } : {}),
      });
      closeEditDriver();
    } catch (err) {
      console.error("Erro ao editar motorista:", err);
      alert("Erro ao salvar alterações. Verifique a conexão.");
    } finally {
      setSavingEdit(false);
    }
  }, [editingDriver, eName, eLogin, ePassword, eVehicle, eVin, eCategories, eVehiclePhoto, eExistingPhoto, closeEditDriver]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "drivers"), (snap) => {
      const list: Driver[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Driver));
      setDrivers(list);
    });
    const unsub2 = onSnapshot(collection(db, "categories"), (snap) => {
      const list: VehicleCategory[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as VehicleCategory));
      setCategories(list);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const addDriver = useCallback(async () => {
    if (!dName || !dLogin || !dPassword || dCategories.length === 0) return;
    setUploadingPhoto(true);
    try {
      let vehiclePhotoUrl = "";
      if (dVehiclePhoto) {
        const ext = dVehiclePhoto.name.split(".").pop() || "jpg";
        const fileName = `vehicles/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const storageRef = ref(storage, fileName);
        await uploadBytesResumable(storageRef, dVehiclePhoto);
        vehiclePhotoUrl = await getDownloadURL(storageRef);
      }
      const id = crypto.randomUUID();
      await setDoc(doc(db, "drivers", id), {
        name: dName, login: dLogin, password: dPassword,
        vehicle: dVehicle, vin: dVin, categoryIds: dCategories, categoryId: dCategories[0] || "",
        ...(vehiclePhotoUrl ? { vehiclePhoto: vehiclePhotoUrl } : {}),
      });
      setDName(""); setDLogin(""); setDPassword(""); setDVehicle(""); setDVin(""); setDCategories([]);
      setDVehiclePhoto(null); setDVehiclePhotoPreview("");
    } catch (err) {
      console.error("Erro ao adicionar motorista:", err);
      alert("Erro ao adicionar motorista. Verifique a conexão.");
    } finally {
      setUploadingPhoto(false);
    }
  }, [dName, dLogin, dPassword, dVehicle, dVin, dCategories, dVehiclePhoto]);

  const removeDriver = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "drivers", id));
  }, []);

  const addCategory = useCallback(async () => {
    if (!cName) return;
    const id = crypto.randomUUID();
    await setDoc(doc(db, "categories", id), { name: cName, description: cDesc });
    setCName(""); setCDesc("");
  }, [cName, cDesc]);

  const removeCategory = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
  }, []);

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors";
  const btnClass = "w-full bg-neon text-primary-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40";

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["drivers", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium border transition-colors ${
              subTab === t
                ? "bg-neon text-primary-foreground border-neon"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "drivers" ? "Motoristas" : "Categorias"}
          </button>
        ))}
      </div>

      {subTab === "categories" && (
        <div className="space-y-4">
          <h3 className="text-sm font-display font-semibold flex items-center gap-2">
            <span className="text-neon">📂</span> Nova Categoria
          </h3>
          <input placeholder="Nome da categoria" value={cName} onChange={(e) => setCName(e.target.value)} className={inputClass} />
          <input placeholder="Descrição" value={cDesc} onChange={(e) => setCDesc(e.target.value)} className={inputClass} />
          <button onClick={addCategory} disabled={!cName} className={btnClass}>Adicionar Categoria</button>

          <div className="h-px bg-border" />
          <h3 className="text-sm font-display font-semibold">Categorias cadastradas</h3>
          {categories.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria</p>}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
              <div>
                <p className="text-sm font-body font-medium">{c.name}</p>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              </div>
              <button onClick={() => removeCategory(c.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {subTab === "drivers" && (
        <div className="space-y-4">
          <h3 className="text-sm font-display font-semibold flex items-center gap-2">
            <span className="text-neon">🚗</span> Novo Motorista
          </h3>
          <input placeholder="Nome completo" value={dName} onChange={(e) => setDName(e.target.value)} className={inputClass} />
          <input placeholder="Login (usuário)" value={dLogin} onChange={(e) => setDLogin(e.target.value)} className={inputClass} />
          <input type="password" placeholder="Senha" value={dPassword} onChange={(e) => setDPassword(e.target.value)} className={inputClass} />
          <input placeholder="Modelo do veículo" value={dVehicle} onChange={(e) => setDVehicle(e.target.value)} className={inputClass} />
          
          {/* Foto do Veículo */}
          <div className="space-y-2">
            <label className="text-xs font-display font-medium text-muted-foreground">Foto do Veículo</label>
            <input
              ref={vehiclePhotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setDVehiclePhoto(file);
                  setDVehiclePhotoPreview(URL.createObjectURL(file));
                }
              }}
            />
            <button
              type="button"
              onClick={() => vehiclePhotoRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-neon/30 rounded-xl py-4 flex flex-col items-center gap-1 transition-colors"
            >
              {dVehiclePhotoPreview ? (
                <img src={dVehiclePhotoPreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
              ) : (
                <>
                  <span className="text-lg">📷</span>
                  <span className="text-xs text-muted-foreground">Clique para selecionar foto</span>
                </>
              )}
            </button>
            {dVehiclePhoto && (
              <button
                type="button"
                onClick={() => { setDVehiclePhoto(null); setDVehiclePhotoPreview(""); if (vehiclePhotoRef.current) vehiclePhotoRef.current.value = ""; }}
                className="text-xs text-destructive hover:underline"
              >
                Remover foto
              </button>
            )}
          </div>

          <input placeholder="VIN number" value={dVin} onChange={(e) => setDVin(e.target.value)} className={inputClass} />
          <div className="space-y-2">
            <label className="text-xs font-display font-medium text-muted-foreground">Categorias (selecione uma ou mais)</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const checked = dCategories.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked ? "bg-neon/15 border-neon text-foreground" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-neon"
                      checked={checked}
                      onChange={(e) =>
                        setDCategories((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                        )
                      }
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>
          {categories.length === 0 && (
            <p className="text-xs text-destructive">Cadastre categorias antes de adicionar motoristas.</p>
          )}
          <button onClick={addDriver} disabled={!dName || !dLogin || !dPassword || dCategories.length === 0 || uploadingPhoto} className={btnClass}>
            {uploadingPhoto ? "Enviando..." : "Adicionar Motorista"}
          </button>

          <div className="h-px bg-border" />
          <h3 className="text-sm font-display font-semibold">Motoristas cadastrados</h3>
          {drivers.length === 0 && <p className="text-xs text-muted-foreground">Nenhum motorista</p>}
          {drivers.map((d) => {
            const driverCatIds =
              d.categoryIds && d.categoryIds.length > 0
                ? d.categoryIds
                : d.categoryId
                ? [d.categoryId]
                : [];
            const driverCats = driverCatIds
              .map((id) => categories.find((c) => c.id === id))
              .filter(Boolean) as VehicleCategory[];
            return (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                {d.vehiclePhoto && (
                  <img src={d.vehiclePhoto} alt="Veículo" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium">{d.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {driverCats.length > 0 ? (
                      driverCats.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-display font-semibold bg-neon/15 text-neon border border-neon/30"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sem categoria</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.vehicle} • Login: {d.login} • Senha: {d.password}
                  </p>
                </div>
                <button
                  onClick={() => openEditDriver(d)}
                  className="text-muted-foreground hover:text-neon transition-colors text-sm"
                  title="Editar motorista"
                >
                  ✏️
                </button>
                <button onClick={() => removeDriver(d.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm" title="Remover motorista">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Driver Modal */}
      {editingDriver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(10,10,10,0.85)" }}
          onClick={closeEditDriver}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-display font-bold flex items-center gap-2">
              <span style={{ color: "#4CAF50" }}>✏️</span> Editar Motorista
            </h3>

            <input placeholder="Nome completo" value={eName} onChange={(e) => setEName(e.target.value)} className={inputClass} />
            <input placeholder="Login (usuário)" value={eLogin} onChange={(e) => setELogin(e.target.value)} className={inputClass} />
            <input type="text" placeholder="Senha" value={ePassword} onChange={(e) => setEPassword(e.target.value)} className={inputClass} />
            <input placeholder="Modelo do veículo" value={eVehicle} onChange={(e) => setEVehicle(e.target.value)} className={inputClass} />

            {/* Foto do veículo */}
            <div className="space-y-2">
              <label className="text-xs font-display font-medium text-muted-foreground">Foto do Veículo</label>
              <input
                ref={editPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEVehiclePhoto(file);
                    setEVehiclePhotoPreview(URL.createObjectURL(file));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => editPhotoRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-neon/30 rounded-xl py-3 flex flex-col items-center gap-1 transition-colors"
              >
                {eVehiclePhotoPreview ? (
                  <img src={eVehiclePhotoPreview} alt="Nova foto" className="h-20 w-auto rounded-lg object-cover" />
                ) : eExistingPhoto ? (
                  <div className="flex flex-col items-center gap-1">
                    <img src={eExistingPhoto} alt="Foto atual" className="h-20 w-auto rounded-lg object-cover" />
                    <span className="text-[10px] text-muted-foreground">Clique para substituir</span>
                  </div>
                ) : (
                  <>
                    <span className="text-lg">📷</span>
                    <span className="text-xs text-muted-foreground">Clique para selecionar foto</span>
                  </>
                )}
              </button>
              {eVehiclePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setEVehiclePhoto(null);
                    setEVehiclePhotoPreview("");
                    if (editPhotoRef.current) editPhotoRef.current.value = "";
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Cancelar nova foto
                </button>
              )}
            </div>

            <input placeholder="VIN number" value={eVin} onChange={(e) => setEVin(e.target.value)} className={inputClass} />
            <select value={eCategory} onChange={(e) => setECategory(e.target.value)} className={inputClass}>
              <option value="">Selecione a categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeEditDriver}
                className="flex-1 border border-border text-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditDriver}
                disabled={savingEdit || !eName || !eLogin || !ePassword || !eCategory}
                className="flex-1 font-display font-semibold py-2.5 rounded-lg text-sm transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: "#4CAF50", color: "#0a0a0a" }}
              >
                {savingEdit ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
