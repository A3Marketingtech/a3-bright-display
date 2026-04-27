import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { MediaItem, Advertiser } from "@/lib/types";
import a3Logo from "@/assets/a3-logo.png";

const Coupon = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!mediaId) {
        setError("Cupom inválido");
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "media", mediaId));
        if (!snap.exists()) {
          if (!cancelled) {
            setError("Cupom não encontrado");
            setLoading(false);
          }
          return;
        }
        const m = { id: snap.id, ...snap.data() } as MediaItem;
        if (cancelled) return;
        setMedia(m);

        if (m.advertiserId) {
          const aSnap = await getDoc(doc(db, "advertisers", m.advertiserId));
          if (!cancelled && aSnap.exists()) {
            setAdvertiser({ id: aSnap.id, ...aSnap.data() } as Advertiser);
          }
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Erro ao carregar cupom");
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [mediaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="font-display text-sm text-muted-foreground">Carregando cupom…</p>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center space-y-3">
          <p className="text-4xl">🎟️</p>
          <p className="font-display font-bold text-lg">{error || "Cupom indisponível"}</p>
        </div>
      </div>
    );
  }

  const hasCoupon = !!media.couponDiscount;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {media.type === "image" && (
          <div className="w-full aspect-video bg-black">
            <img src={media.url} alt={media.label || media.name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="p-6 space-y-4 text-center">
          {advertiser && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              {advertiser.name}
            </p>
          )}
          <h1 className="font-display font-bold text-2xl">
            {media.label || media.name}
          </h1>
          {hasCoupon ? (
            <>
              <div className="border-2 border-dashed border-neon rounded-xl py-6 px-4 bg-neon/5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Seu desconto
                </p>
                <p className="font-display font-bold text-3xl text-neon">
                  {media.couponDiscount}
                </p>
              </div>
              {media.couponExpiry && (
                <p className="text-xs text-muted-foreground font-body">
                  Válido por {media.couponExpiry} a partir do scan
                </p>
              )}
              <p className="text-[11px] text-muted-foreground font-body">
                Apresente esta tela no estabelecimento para resgatar.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Cupom sem desconto cadastrado.</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t border-border py-3">
          <span className="text-[10px] text-muted-foreground/70 font-body">Powered by</span>
          <img src={a3Logo} alt="A³ Marketing" className="h-3 w-auto" />
        </div>
      </div>
    </div>
  );
};

export default Coupon;
