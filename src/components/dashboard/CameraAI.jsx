import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { Camera, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

const CameraAI = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);
  const trackedObjectsRef = useRef({});
  const nextIdRef = useRef(1);
  const { updateCameraNode, isEmergencyMode } = useDashboard();

  // Load the COCO-SSD model on mount
  useEffect(() => {
    let active = true;
    cocoSsd.load().then(loadedModel => {
      if (active) {
         setModel(loadedModel);
         console.log("AI Model Loaded.");
      }
    }).catch(err => {
      if (active) setError("Failed to load AI model. Check console.");
      console.error(err);
    });
    return () => { active = false; };
  }, []);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
         video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setError("Please allow camera permissions to use Computer Vision.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setIsCameraActive(false);
    updateCameraNode('cam-main', 0); // Reset count when off
    trackedObjectsRef.current = {};
    nextIdRef.current = 1;
  };

  // Detection Loop
  const detectObjects = async () => {
    if (model && videoRef.current && isCameraActive && !isEmergencyMode) {
       // Validate video state
       if (videoRef.current.readyState === 4) {
          const predictions = await model.detect(videoRef.current);
          
          // Filter out anything that isn't a "person"
          const people = predictions.filter(pred => pred.class === 'person');
          
          // Calculate centroids and perform tracking
          const currentCentroids = people.map(p => {
             const [x, y, w, h] = p.bbox;
             return { cx: x + w/2, cy: y + h/2, bbox: p.bbox, score: p.score };
          });

          const newTracked = {};
          currentCentroids.forEach(c => {
             let bestId = null;
             let minDist = 150; // Max pixel distance to be considered the same person
             
             Object.keys(trackedObjectsRef.current).forEach(id => {
                const trk = trackedObjectsRef.current[id];
                const dist = Math.sqrt(Math.pow(c.cx - trk.cx, 2) + Math.pow(c.cy - trk.cy, 2));
                if (dist < minDist && !newTracked[id]) {
                   minDist = dist;
                   bestId = id;
                }
             });

             if (bestId) {
                const prev = trackedObjectsRef.current[bestId];
                const history = [...prev.history, {x: c.cx, y: c.cy}].slice(-10); // keep last 10 points
                
                let dx = 0; let dy = 0;
                if (history.length > 3) {
                   dx = c.cx - history[0].x; // Vector from N frames ago
                   dy = c.cy - history[0].y;
                }
                newTracked[bestId] = { ...c, id: bestId, history, dx, dy };
             } else {
                newTracked[nextIdRef.current] = { ...c, id: nextIdRef.current, history: [{x: c.cx, y: c.cy}], dx: 0, dy: 0 };
                nextIdRef.current++;
             }
          });
          
          trackedObjectsRef.current = newTracked;

          // Update Global Context
          updateCameraNode('cam-main', Object.keys(newTracked).length);

          // Draw Bounding Boxes and Vectors
          if (canvasRef.current) {
             const ctx = canvasRef.current.getContext('2d');
             ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
             
             ctx.font = '16px Helvetica';
             ctx.textBaseline = 'top';

             Object.values(trackedObjectsRef.current).forEach(person => {
                const [x, y, width, height] = person.bbox;
                
                // Draw Box
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);
                
                // Draw ID and Confidence Label
                ctx.fillStyle = '#00FF00';
                const labelText = `ID: ${person.id} | ${(person.score * 100).toFixed(0)}%`;
                ctx.fillRect(x, y, ctx.measureText(labelText).width + 10, 25);
                ctx.fillStyle = '#000000';
                ctx.fillText(labelText, x + 5, y + 5);

                // Draw Movement Director Arrow
                if (Math.abs(person.dx) > 15 || Math.abs(person.dy) > 15) {
                   ctx.beginPath();
                   ctx.moveTo(person.cx, person.cy);
                   ctx.lineTo(person.cx + person.dx, person.cy + person.dy);
                   ctx.strokeStyle = '#FF3366'; // Reddish-pink vector line
                   ctx.lineWidth = 4;
                   ctx.stroke();

                   // Arrowhead
                   const angle = Math.atan2(person.dy, person.dx);
                   ctx.beginPath();
                   ctx.moveTo(person.cx + person.dx, person.cy + person.dy);
                   ctx.lineTo(person.cx + person.dx - 12 * Math.cos(angle - Math.PI / 6), person.cy + person.dy - 12 * Math.sin(angle - Math.PI / 6));
                   ctx.lineTo(person.cx + person.dx - 12 * Math.cos(angle + Math.PI / 6), person.cy + person.dy - 12 * Math.sin(angle + Math.PI / 6));
                   ctx.fillStyle = '#FF3366';
                   ctx.fill();
                }
             });
          }
       }
    }
    
    // Check if we should continue tracking
    if (isCameraActive && !isEmergencyMode) {
       requestRef.current = requestAnimationFrame(detectObjects);
    }
  };

  // Trigger Detection loop when dependencies change
  useEffect(() => {
     if (isCameraActive && model && !isEmergencyMode) {
        requestRef.current = requestAnimationFrame(detectObjects);
     }
     return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
     };
  }, [isCameraActive, model, isEmergencyMode]);

  useEffect(() => {
     // Teardown on unmount
     return () => stopCamera();
  }, []);

  return (
    <div className="card mt-4 overflow-hidden" style={{ minHeight: '350px' }}>
      <div className="card-header pb-2 border-bottom flex-between">
         <h3><Camera size={18} className="mr-2 inline" /> Smart CCTV Analytics</h3>
         <div className="flex-center-left gap-2">
            {!isCameraActive ? (
               <button 
                 className={`btn btn-sm ${model ? 'btn-primary' : 'bg-secondary'}`}
                 onClick={startCamera}
                 disabled={!model}
               >
                 {model ? 'ACTIVATE FEED' : 'LOADING AI...'}
               </button>
            ) : (
               <button className="btn btn-sm text-danger border border-danger" onClick={stopCamera}>
                 SHUTDOWN FEED
               </button>
            )}
            {isCameraActive && <span className="badge text-xs bg-danger-glow text-danger border border-danger p-1 rounded animate-pulse">REC</span>}
         </div>
      </div>
      
      <div className="p-4 relative bg-base flex-center" style={{ height: '350px', backgroundColor: 'var(--bg-card)' }}>
         {!isCameraActive && !error && (
            <div className="text-center text-muted">
               <Camera size={48} className="mx-auto opacity-20 mb-2" />
               <p>Camera hardware currently idled to save CPU.</p>
               <p className="text-sm mt-1">Activate feed to engage TensorFlow.js Object Detection.</p>
            </div>
         )}
         
         {error && (
            <div className="text-center text-danger">
               <AlertCircle size={48} className="mx-auto opacity-80 mb-2" />
               <p>{error}</p>
            </div>
         )}

         {/* Hidden Video element holding the raw hardware stream */}
         <video 
           ref={videoRef}
           style={{ display: 'none' }}
           width="640" 
           height="480"
           muted
         />

         {/* Canvas overlay representing the feed with bounding boxes */}
         {isCameraActive && (
            <div className="relative" style={{ width: '100%', height: '100%', maxWidth: '640px', maxHeight: '480px' }}>
               <video
                 srcObject={videoRef.current ? videoRef.current.srcObject : null}
                 autoPlay
                 muted
                 playsInline
                 className="absolute inset-0 w-full h-full object-cover rounded border"
                 style={{ zIndex: 1 }}
               />
               <canvas
                 ref={canvasRef}
                 width={640} // Default TFJS resolutions
                 height={480}
                 className="absolute inset-0 w-full h-full object-cover z-10"
                 style={{ zIndex: 10 }}
               />
            </div>
         )}
      </div>
    </div>
  );
};

export default CameraAI;
