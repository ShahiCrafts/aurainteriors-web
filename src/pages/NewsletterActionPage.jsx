import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../api";
export default function NewsletterActionPage() {
  const [params] = useSearchParams();
  const unsubscribe = useLocation().pathname.endsWith("unsubscribe");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const token = params.get("token");
  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/newsletter/${encodeURIComponent(unsubscribe ? "unsubscribe" : "confirm")}`, { token });
      setMessage(data.message); setDone(true);
    } catch (error) { setMessage(error.response?.data?.message || "Unable to process this request. Please try again."); }
    finally { setBusy(false); }
  };
  return <main className="max-w-lg mx-auto px-6 py-20"><h1 className="text-2xl font-semibold">{unsubscribe ? "Unsubscribe from the newsletter" : "Confirm newsletter subscription"}</h1>
    <p className="my-6" role="status">{message || (token ? "Use the button below to confirm your choice." : "Open the link provided in your newsletter email.")}</p>
    {token && !done && <button className="px-5 py-3 rounded bg-neutral-900 text-white" disabled={busy} onClick={submit}>{busy ? "Processing…" : unsubscribe ? "Unsubscribe" : "Confirm subscription"}</button>}</main>;
}
