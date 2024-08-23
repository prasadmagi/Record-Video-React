import { useEffect, useRef, useState } from 'react';

function App() {
  const [videoURL, setVideoURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaStreamRef = useRef(null);
  const mediaRecordRef = useRef(null);
  const recordingTimerRef = useRef(null); // To store the timer reference

  useEffect(() => {
    // Cleanup timers and stream on component unmount
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;

      const mediaRecord = new MediaRecorder(stream);
      mediaRecordRef.current = mediaRecord;

      const chunks = [];

      mediaRecord.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecord.onstop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoURL(URL.createObjectURL(blob));
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        // Cleanup recording timer
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
        }

        // Trigger download immediately after recording stops
        downloadBlob(blob, 'recorded-video.webm');
      };

      mediaRecord.start();
      setIsRecording(true);
      recordingTimerRef.current = setTimeout(() => {
        mediaRecord.stop();
        setIsRecording(false);
      }, 10000); // 10 seconds
    } catch (err) {
      console.log(err, "error-start-record");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecordRef.current) {
      mediaRecordRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div>Video Recording</div>
      <video
        width="500"
        height="700"
        autoPlay
        ref={(videoEle) => {
          if (videoEle && mediaStreamRef.current) {
            videoEle.srcObject = mediaStreamRef.current;
          }
        }}
      ></video>
      <div>
        {isRecording ? (
          <button onClick={() => {
            if (mediaRecordRef.current) {
              mediaRecordRef.current.stop();
              setIsRecording(false);
            }
          }}>Stop Recording</button>
        ) : (
          <button onClick={handleStartRecording}>Start Recording</button>
        )}
      </div>
      {/* Optionally display recorded video */}
      {videoURL && (
        <div>
          <video width="640" height="480" controls src={videoURL}></video>
        </div>
      )}
    </>
  );
}

export default App;
