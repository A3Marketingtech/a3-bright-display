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
  const [dCategory, setDCategory] = useState("");

  // Category form
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");

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
    if (!dName || !dLogin || !dPassword || !dCategory) return;
    const id = crypto.randomUUID();
    await setDoc(doc(db, "drivers", id), {
      name: dName, login: dLogin, password: dPassword,
      vehicle: dVehicle, vin: dVin, categoryId: dCategory,
    });
    setDName(""); setDLogin(""); setDPassword(""); setDVehicle(""); setDVin(""); setDCategory("");
  }, [dName, dLogin, dPassword, dVehicle, dVin, dCategory]);

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
          <input placeholder="VIN number" value={dVin} onChange={(e) => setDVin(e.target.value)} className={inputClass} />
          <select value={dCategory} onChange={(e) => setDCategory(e.target.value)} className={inputClass}>
            <option value="">Selecione a categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-destructive">Cadastre categorias antes de adicionar motoristas.</p>
          )}
          <button onClick={addDriver} disabled={!dName || !dLogin || !dPassword || !dCategory} className={btnClass}>Adicionar Motorista</button>

          <div className="h-px bg-border" />
          <h3 className="text-sm font-display font-semibold">Motoristas cadastrados</h3>
          {drivers.length === 0 && <p className="text-xs text-muted-foreground">Nenhum motorista</p>}
          {drivers.map((d) => {
            const cat = categories.find((c) => c.id === d.categoryId);
            return (
              <div key={d.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                <div>
                  <p className="text-sm font-body font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.vehicle} • {cat?.name || "Sem categoria"} • Login: {d.login} • Senha: {d.password}
                  </p>
                </div>
                <button onClick={() => removeDriver(d.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
