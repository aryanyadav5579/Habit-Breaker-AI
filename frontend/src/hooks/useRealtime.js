import { useEffect } from "react";

import { API_BASE_URL } from "../api/client.js";

export function useRealtime(onMessage) {
  useEffect(() => {
    const token = localStorage.getItem("habitBreakerToken");
    if (!token) {
      return undefined;
    }

    const base = API_BASE_URL || window.location.origin;
    const url = new URL(`${base.replace(/^http/, "ws")}/api/ws/dashboard`);
    url.searchParams.set("token", token);
    const socket = new WebSocket(url);

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage({ type: "raw", payload: event.data });
      }
    };

    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 25000);

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, [onMessage]);
}

