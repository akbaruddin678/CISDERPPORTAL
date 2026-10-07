import ZKLib from "zklib-js";
import axios from "axios";

// Real-time bridge to a physical ZKTeco biometric device — connects over
// its native TCP/UDP protocol (zklib-js), and forwards every punch to the
// same /punch endpoint a browser-based Kiosk hits, using the same shared
// secret. The device and this bridge must be reachable from wherever this
// backend process actually runs (same LAN, or a VPN/tunnel to it) — a
// device on an office LAN is not reachable from an unrelated host.
const RECONNECT_DELAY_MS = 10000;

let zkInstance = null;
let reconnectTimer = null;

const punchUrl = () => `http://localhost:${process.env.PORT || 5000}/api/attendance-device/punch`;

const forwardPunch = async ({ userId, attTime }) => {
  const biometricId = String(userId || "").trim();
  if (!biometricId) return;

  // Logged immediately on receipt — before forwarding — so the raw tap is
  // always visible in the console even if the forward call below fails.
  console.log(`[ZK Bridge] Raw punch received — biometricId="${biometricId}", time=${new Date(attTime).toLocaleString()}`);

  try {
    const { data } = await axios.post(
      punchUrl(),
      { biometricId, timestamp: attTime, source: "device" },
      { headers: { "x-biometric-secret": process.env.BIOMETRIC_DEVICE_SECRET } },
    );
    console.log(`[ZK Bridge] ${data.message}`);
  } catch (err) {
    console.error(
      `[ZK Bridge] Failed to forward punch for biometricId "${biometricId}":`,
      err.response?.data?.message || err.message,
    );
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectAndListen();
  }, RECONNECT_DELAY_MS);
};

const connectAndListen = async () => {
  const ip = process.env.ZK_DEVICE_IP;
  const port = Number(process.env.ZK_DEVICE_PORT) || 4370;

  zkInstance = new ZKLib(ip, port, 10000, 4000);

  try {
    // cbError/cbClose fire on socket drop — reconnect automatically
    // instead of silently going dark until the process is restarted.
    await zkInstance.createSocket(
      () => scheduleReconnect(),
      () => scheduleReconnect(),
    );
    console.log(`[ZK Bridge] Connected to biometric device at ${ip}:${port}.`);
    await zkInstance.getRealTimeLogs(forwardPunch);
    console.log("[ZK Bridge] Listening for real-time punches.");
  } catch (err) {
    console.error(
      `[ZK Bridge] Could not connect to ${ip}:${port} (${err.message || err}) — retrying in ${RECONNECT_DELAY_MS / 1000}s.`,
    );
    scheduleReconnect();
  }
};

// Only attempts a connection when a device is actually configured — no
// fake "success" when there's no real hardware wired up, matching the
// IT_DEPARTMENT_EMAIL guard style already used in hrStaffController.js.
export const startZkBridge = () => {
  if (!process.env.ZK_DEVICE_IP) {
    console.log("[ZK Bridge] ZK_DEVICE_IP not configured — skipping biometric device connection.");
    return;
  }
  if (!process.env.BIOMETRIC_DEVICE_SECRET) {
    console.error("[ZK Bridge] BIOMETRIC_DEVICE_SECRET not configured — refusing to start (punches couldn't be forwarded securely).");
    return;
  }
  connectAndListen();
};
