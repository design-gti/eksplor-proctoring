import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Secondary camera hook — connects HP via WebRTC/PeerJS.
 * HP opens /phone-camera?peer=<peerId>, streams environment camera to desktop.
 *
 * connectionStatus: 'idle' | 'waiting' | 'connected' | 'error'
 */
export default function useSecondaryCamera({ enabled = false } = {}) {
  const [peerId, setPeerId] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState(null)
  const remoteVideoRef = useRef(null)
  const peerRef = useRef(null)
  const callRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      callRef.current?.close()
      peerRef.current?.destroy()
    }
  }, [])

  const startListening = useCallback(async () => {
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    setConnectionStatus('waiting')
    setErrorMessage(null)
    setPeerId(null)
    setQrUrl(null)

    try {
      const { Peer } = await import('peerjs')
      const peer = new Peer()
      peerRef.current = peer

      peer.on('open', (id) => {
        setPeerId(id)
        const url = `${window.location.origin}/phone-camera?peer=${id}`
        setQrUrl(url)
        localStorage.setItem('hp_peer_id', id)
      })

      peer.on('call', (call) => {
        callRef.current = call
        call.answer() // desktop answers with no stream (only receives)
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
          setConnectionStatus('connected')
          localStorage.setItem('hp_camera_connected', 'true')
        })
        call.on('close', () => {
          setConnectionStatus('waiting')
          localStorage.removeItem('hp_camera_connected')
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
        })
        call.on('error', () => {
          setConnectionStatus('error')
          setErrorMessage('Koneksi kamera HP terputus.')
        })
      })

      peer.on('error', (err) => {
        setConnectionStatus('error')
        setErrorMessage(`Error: ${err.type}`)
      })
    } catch (e) {
      setConnectionStatus('error')
      setErrorMessage(e.message)
    }
  }, [])

  const disconnect = useCallback(() => {
    callRef.current?.close()
    peerRef.current?.destroy()
    callRef.current = null
    peerRef.current = null
    setPeerId(null)
    setQrUrl(null)
    setConnectionStatus('idle')
    setErrorMessage(null)
    localStorage.removeItem('hp_camera_connected')
    localStorage.removeItem('hp_peer_id')
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [])

  // Simulation helpers for UI development / slicing
  const simulateConnect = useCallback(() => {
    setPeerId('demo-peer-id')
    setQrUrl(`${window.location.origin}/phone-camera?peer=demo-peer-id`)
    setConnectionStatus('connected')
    localStorage.setItem('hp_camera_connected', 'true')
  }, [])

  const simulateWaiting = useCallback(() => {
    setPeerId('demo-peer-id')
    setQrUrl(`${window.location.origin}/phone-camera?peer=demo-peer-id`)
    setConnectionStatus('waiting')
    localStorage.removeItem('hp_camera_connected')
  }, [])

  const simulateDisconnect = useCallback(() => {
    setConnectionStatus('idle')
    setPeerId(null)
    setQrUrl(null)
    localStorage.removeItem('hp_camera_connected')
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [])

  return {
    peerId,
    qrUrl,
    connectionStatus,
    errorMessage,
    remoteVideoRef,
    startListening,
    disconnect,
    simulateConnect,
    simulateWaiting,
    simulateDisconnect,
  }
}
