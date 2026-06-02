import { useState } from 'react'

/**
 * Mock phone detection hook.
 * In production, integrate TensorFlow.js COCO-SSD object detection model.
 */
export default function usePhoneDetection({ enabled = true } = {}) {
  const [phoneDetected, setPhoneDetected] = useState(false)
  const [loading, setLoading] = useState(false)

  return { phoneDetected, loading, setPhoneDetected }
}
