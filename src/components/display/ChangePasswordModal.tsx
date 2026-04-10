import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { Driver } from "@/lib/types";

interface ChangePasswordModalProps {
  driver: Driver;
  onClose: () => void;
  onSuccess: (updatedDriver: Driver) => void;
}

export function ChangePasswordModal({ driver, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (currentPassword !== driver.password) {
      setError("Senha atual incorreta");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError("A nova senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova senha deve ser diferente da atual");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "drivers", driver.id), { password: newPassword });
      onSuccess({ ...driver, password: newPassword });
    } catch {
      setError("Erro ao salvar — tente novamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(10,10,10,0.85)" }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-[2vw] w-[clamp(280px,24vw,420px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-[clamp(0.8rem,1vw,1.1rem)] mb-[0.5vh]">
          Alterar Senha
        </h3>
        <p className="text-[clamp(0.65rem,0.75vw,0.85rem)] text-muted-foreground mb-[1.5vh]">
          Preencha os campos abaixo para alterar sua senha
        </p>

        <div className="space-y-[1vh]">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="w-full bg-secondary border border-border rounded-lg px-[1vw] py-[0.8vh] text-[clamp(0.75rem,0.85vw,1rem)] font-body focus:outline-none focus:border-neon/50 transition-colors"
            autoFocus
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="w-full bg-secondary border border-border rounded-lg px-[1vw] py-[0.8vh] text-[clamp(0.75rem,0.85vw,1rem)] font-body focus:outline-none focus:border-neon/50 transition-colors"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Confirmar nova senha"
            className="w-full bg-secondary border border-border rounded-lg px-[1vw] py-[0.8vh] text-[clamp(0.75rem,0.85vw,1rem)] font-body focus:outline-none focus:border-neon/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive font-body text-center mt-[1vh]">{error}</p>
        )}

        <div className="flex gap-[0.5vw] mt-[1.5vh]">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary text-foreground font-display font-semibold py-[0.8vh] rounded-lg text-[clamp(0.75rem,0.85vw,1rem)] hover:opacity-80 transition-opacity"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="flex-1 bg-neon text-primary-foreground font-display font-semibold py-[0.8vh] rounded-lg text-[clamp(0.75rem,0.85vw,1rem)] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
