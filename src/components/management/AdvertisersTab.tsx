import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import type { Advertiser } from "@/lib/types";

export function AdvertisersTab() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "advertisers"), (snap) => {
      const list: Advertiser[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Advertiser));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setAdvertisers(list);
    });
    return unsub;
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setContractStart("");
    setContractEnd("");
    setAutoRenew(false);
    setEditingId(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !contractStart || !contractEnd) return;

    const data = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password.trim(),
      contractStart,
      contractEnd,
      autoRenew,
    };

    if (editingId) {
      await updateDoc(doc(db, "advertisers", editingId), data);
    } else {
      const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      await setDoc(doc(db, "advertisers", id), data);
    }
    resetForm();
  }, [name, email, phone, password, contractStart, contractEnd, autoRenew, editingId]);

  const handleEdit = (adv: Advertiser) => {
    setName(adv.name);
    setEmail(adv.email);
    setPhone(adv.phone);
    setPassword(adv.password || "");
    setContractStart(adv.contractStart);
    setContractEnd(adv.contractEnd);
    setAutoRenew(adv.autoRenew);
    setEditingId(adv.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este anunciante?")) return;
    await deleteDoc(doc(db, "advertisers", id));
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const getStatus = (adv: Advertiser) => {
    if (!isExpired(adv.contractEnd)) return "active";
    if (adv.autoRenew) return "active";
    return "expired";
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors";

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-semibold flex items-center gap-2">
          <span className="text-neon">📋</span> {editingId ? "Editar Anunciante" : "Cadastrar Anunciante"}
        </h3>

        <input
          type="text"
          placeholder="Nome do anunciante"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Email de contato"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="tel"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-display font-medium text-muted-foreground">
              Início do contrato
            </label>
            <input
              type="date"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-display font-medium text-muted-foreground">
              Fim do contrato
            </label>
            <input
              type="date"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setAutoRenew(!autoRenew)}
            className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${
              autoRenew ? "bg-neon" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                autoRenew ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm font-body">Renovação Automática</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !contractStart || !contractEnd}
            className="flex-1 bg-neon text-primary-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {editingId ? "Salvar Alterações" : "Adicionar Anunciante"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2.5 border border-border rounded-lg text-sm font-display text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* List */}
      <div className="space-y-2">
        <h3 className="text-sm font-display font-semibold flex items-center gap-2">
          <span className="text-neon">📂</span> Anunciantes Cadastrados ({advertisers.length})
        </h3>

        {!advertisers.length && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum anunciante cadastrado
          </p>
        )}

        {advertisers.map((adv) => {
          const status = getStatus(adv);
          return (
            <div
              key={adv.id}
              className="p-3 bg-secondary rounded-lg border border-border hover:border-neon/20 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-display font-semibold truncate">{adv.name}</p>
                    <span
                      className={`text-[10px] font-display font-bold px-1.5 py-0.5 rounded ${
                        status === "active"
                          ? "bg-neon/15 text-neon"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {status === "active" ? "ATIVO" : "EXPIRADO"}
                    </span>
                    {adv.autoRenew && (
                      <span className="text-[10px] font-display px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground">
                        🔄 Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{adv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {adv.contractStart} → {adv.contractEnd}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(adv)}
                    className="text-xs text-muted-foreground hover:text-neon transition-colors px-2 py-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(adv.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
