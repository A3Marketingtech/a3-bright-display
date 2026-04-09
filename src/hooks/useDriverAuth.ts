import { useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Driver } from "@/lib/types";

export function useDriverAuth() {
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [loginError, setLoginError] = useState("");

  const login = useCallback(async (loginId: string, password: string) => {
    setLoginError("");
    try {
      const q = query(
        collection(db, "drivers"),
        where("login", "==", loginId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setLoginError("Usuário não encontrado");
        return false;
      }
      const doc = snap.docs[0];
      const driver = { id: doc.id, ...doc.data() } as Driver;
      if (driver.password !== password) {
        setLoginError("Senha incorreta");
        return false;
      }
      setCurrentDriver(driver);
      return true;
    } catch {
      setLoginError("Erro de conexão");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentDriver(null);
  }, []);

  return { currentDriver, loginError, login, logout };
}
