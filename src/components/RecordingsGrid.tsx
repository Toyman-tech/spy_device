"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FileAudio, Clock } from "lucide-react";
import CustomAudioPlayer from "./CustomAudioPlayer";

type Recording = {
  name: string;
  created_at: string | null;
  url: string;
};

export default function RecordingsGrid() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchRecordings = async () => {
      const BUCKET_NAME = "spy-bug";
      
      // Omit empty string to fix "Invalid path" issues in some JS clients
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(undefined, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) {
        console.error("Error fetching recordings:", error);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Filter out placeholder files like .emptyFolderPlaceholder
        const validFiles = data.filter((file) => file.name !== ".emptyFolderPlaceholder");
        
        // Use createSignedUrl instead of getPublicUrl to ensure private buckets can be streamed
        const recordingsWithUrls: Recording[] = await Promise.all(
          validFiles.map(async (file) => {
            const { data: signedData } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(file.name, 3600); // URL expires in 1 hour
              
            return {
              name: file.name,
              created_at: file.created_at,
              url: signedData?.signedUrl || "",
            };
          })
        );
        
        setRecordings(recordingsWithUrls);
      }
      setIsLoading(false);
    };

    fetchRecordings();
  }, []);

  if (isLoading) {
    return <div className="empty-state">Loading recordings...</div>;
  }

  return (
    <div className="recordings-section">
      <h2>
        <FileAudio size={24} color="var(--accent-blue)" />
        Recent Recordings
      </h2>
      
      {recordings.length === 0 ? (
        <div className="empty-state glass-panel">
          <Clock size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem" }} />
          <p>No recordings found.</p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Files uploaded to the 'spy-bug' bucket will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {recordings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((rec, index) => (
              <div key={index} className="recording-card glass-panel">
                <div className="recording-info">
                  <span className="recording-name">{rec.name}</span>
                  <span className="recording-date">
                    {rec.created_at ? new Date(rec.created_at).toLocaleString() : "Unknown date"}
                  </span>
                </div>
                <CustomAudioPlayer src={rec.url} />
              </div>
            ))}
          </div>

          {Math.ceil(recordings.length / ITEMS_PER_PAGE) > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="page-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {Math.ceil(recordings.length / ITEMS_PER_PAGE)}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(recordings.length / ITEMS_PER_PAGE), p + 1))} 
                disabled={currentPage === Math.ceil(recordings.length / ITEMS_PER_PAGE)}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
