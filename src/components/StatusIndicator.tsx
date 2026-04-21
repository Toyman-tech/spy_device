"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Power, PowerOff } from "lucide-react";

export default function StatusIndicator() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rowId, setRowId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("command_center")
        .select("id, trigger_record")
        .limit(1);
      
      if (error) {
        console.error("Error fetching status:", error);
      } else if (data && data.length > 0) {
        setRowId(data[0].id);
        setIsRecording(data[0].trigger_record);
      } else {
        // Automatically insert a control row if the table is completely empty
        const { data: newData, error: insertError } = await supabase
          .from("command_center")
          .insert({ trigger_record: false })
          .select("id, trigger_record");
          
        if (!insertError && newData && newData.length > 0) {
          setRowId(newData[0].id);
          setIsRecording(newData[0].trigger_record);
        }
      }
      setIsLoading(false);
    };

    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "command_center" },
        (payload) => {
          console.log("Realtime update:", payload);
          if (payload.new && "trigger_record" in payload.new) {
            setIsRecording(payload.new.trigger_record);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="status-container">
        <div className="status-badge idle">
          <div className="dot"></div>
          Connecting to device...
        </div>
      </div>
    );
  }

  const toggleSpying = async () => {
    if (rowId === null) return;
    setIsToggling(true);
    const newState = !isRecording;
    
    // We update the backend, and our existing realtime listener will automatically pick up the change!
    const { error } = await supabase
      .from("command_center")
      .update({ trigger_record: newState })
      .eq("id", rowId);
      
    if (error) {
      console.error("Failed to toggle device state:", error);
    }
    
    // We add a tiny delay to prevent spam clicking while DB acknowledges
    setTimeout(() => setIsToggling(false), 500);
  };

  return (
    <div className="status-container" style={{ flexDirection: "column", gap: "1.5rem" }}>
      <div className={`status-badge ${isRecording ? "recording" : "idle"}`}>
        <div className={`dot ${isRecording ? "active" : ""}`}></div>
        {isRecording ? "Recording Active" : "Device Idle"}
      </div>
      
      <button 
        onClick={toggleSpying} 
        disabled={isToggling || rowId === null}
        className={`trigger-btn ${isRecording ? "stop" : "start"}`}
      >
        {isRecording ? <PowerOff size={18} /> : <Power size={18} />}
        {isRecording ? "Stop Spying" : "Start Spying"}
      </button>
    </div>
  );
}
