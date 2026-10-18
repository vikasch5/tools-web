import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "~/components/ui/Field";
import { contrastRatio, encodeQr, qrSvg, wifiPayload, type QrLevel, type WifiSecurity } from "~/tools/engine/qr";
import { Segmented, Switch } from "../OptionControls";
import { Panel, PanelSection, StatusMessage, downloadBlob } from "../Panel";

type Mode = "text" | "wifi";

const levels: { value: QrLevel; label: string }[] = [
  { value: "L", label: "L 7%" },
  { value: "M", label: "M 15%" },
  { value: "Q", label: "Q 25%" },
  { value: "H", label: "H 30%" },
];

function svgToPng(svg: string, size: number) {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The PNG could not be saved."))), "image/png");
    };
    img.onerror = () => reject(new Error("The PNG could not be saved."));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export function QrCode() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("https://example.com");
  const [wifi, setWifi] = useState({ ssid: "", password: "", security: "WPA" as WifiSecurity, hidden: false });
  const [level, setLevel] = useState<QrLevel>("M");
  // User-chosen colours are data written into the QR image, not page styling.
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [pngSize, setPngSize] = useState("1024");
  const [saveError, setSaveError] = useState("");

  const result = useMemo(() => {
    try {
      const data = mode === "text" ? text : wifiPayload(wifi.ssid, wifi.password, wifi.security, wifi.hidden);
      const qr = encodeQr(data, level);
      return { ok: true as const, ...qr, svg: qrSvg(qr.modules, dark, light), bytes: new TextEncoder().encode(data).length };
    } catch (e) {
      return { ok: false as const, message: (e as Error).message };
    }
  }, [mode, text, wifi, level, dark, light]);

  const contrast = contrastRatio(dark, light);
  const lowContrast = contrast < 4 || contrastRatio(dark, "#000000") > contrastRatio(light, "#000000");

  const savePng = async () => {
    if (!result.ok) return;
    try {
      setSaveError("");
      downloadBlob(await svgToPng(result.svg, Number(pngSize)), "qr-code.png");
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  return (
    <Panel
      toolbar={
        <>
          <Segmented
            label="Content"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            choices={[
              { value: "text", label: "Link or text" },
              { value: "wifi", label: "Wi-Fi" },
            ]}
          />
          <Segmented label="Error correction" value={level} onChange={(v) => setLevel(v as QrLevel)} choices={levels} />
        </>
      }
      status={
        saveError ? (
          <StatusMessage tone="error">{saveError}</StatusMessage>
        ) : !result.ok ? (
          <StatusMessage tone={mode === "wifi" && !wifi.ssid ? "idle" : "error"}>{result.message}</StatusMessage>
        ) : lowContrast ? (
          <StatusMessage tone="warning">
            Low contrast: scanners need a dark code on a light background. Pick darker and lighter colours.
          </StatusMessage>
        ) : (
          <StatusMessage tone="success">
            Version {result.version}, {result.size} × {result.size} modules, {result.bytes.toLocaleString("en")} bytes. Test it
            with your phone camera before printing.
          </StatusMessage>
        )
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
        <PanelSection title="Content">
          <div className="space-y-4 bg-surface p-4">
            {mode === "text" ? (
              <TextAreaField
                label="Link or text"
                hint={`${text.length.toLocaleString("en")} characters`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="https://…"
                rows={5}
              />
            ) : (
              <>
                <TextField
                  label="Network name (SSID)"
                  value={wifi.ssid}
                  onChange={(event) => setWifi({ ...wifi, ssid: event.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
                {wifi.security !== "nopass" && (
                  <TextField
                    label="Password"
                    value={wifi.password}
                    onChange={(event) => setWifi({ ...wifi, password: event.target.value })}
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Segmented
                    label="Security"
                    value={wifi.security}
                    onChange={(v) => setWifi({ ...wifi, security: v as WifiSecurity })}
                    choices={[
                      { value: "WPA", label: "WPA/WPA2/WPA3" },
                      { value: "WEP", label: "WEP" },
                      { value: "nopass", label: "None" },
                    ]}
                  />
                  <Switch label="Hidden network" checked={wifi.hidden} onChange={(v) => setWifi({ ...wifi, hidden: v })} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <TextField label="Code colour" type="color" value={dark} onChange={(event) => setDark(event.target.value)} className="[&_input]:p-1" />
              <TextField label="Background" type="color" value={light} onChange={(event) => setLight(event.target.value)} className="[&_input]:p-1" />
              <SelectField label="PNG size" value={pngSize} onChange={(event) => setPngSize(event.target.value)}>
                <option value="512">512 px</option>
                <option value="1024">1024 px</option>
                <option value="2048">2048 px</option>
              </SelectField>
            </div>
          </div>
        </PanelSection>
        <PanelSection title="QR code">
          <div className="flex flex-col items-center gap-4 bg-surface p-4">
            <div className="flex aspect-square w-full max-w-72 items-center justify-center rounded-lg border border-border bg-surface-2/40">
              {result.ok ? (
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`}
                  alt={mode === "text" ? `QR code for ${text.slice(0, 80)}` : `QR code to join the Wi-Fi network ${wifi.ssid}`}
                  className="size-full [image-rendering:pixelated]"
                />
              ) : (
                <p className="px-6 text-center text-sm text-fg-subtle">The QR code appears here.</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="primary" icon={Download} disabled={!result.ok} onClick={savePng}>
                PNG
              </Button>
              <Button
                size="sm"
                icon={Download}
                disabled={!result.ok}
                onClick={() => result.ok && downloadBlob(new Blob([result.svg], { type: "image/svg+xml" }), "qr-code.svg")}
              >
                SVG
              </Button>
            </div>
          </div>
        </PanelSection>
      </div>
    </Panel>
  );
}
