import { useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { Driver } from "@/lib/types";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(function (_, reject) {
      setTimeout(function () { reject(new Error("timeout")); }, ms);
    }),
  ]);
}

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
      const snap = await withTimeout(getDocs(q), 10000);
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
    } catch (err: any) {
      var msg = err && err.message === "timeout"
        ? "Conexão lenta — tente novamente"
        : "Erro de conexão — verifique a rede";
      setLoginError(msg);
      return false;
    }
  }, []);

  const logout = useCallback(function () {
    setCurrentDriver(null);
  }, []);

  const updateDriver = useCallback(function (driver: Driver) {
    setCurrentDriver(driver);
  }, []);

  return { currentDriver, loginError, login, logout, updateDriver };
}
