import React from "react";
import { Modal } from "../design-system/overlays/Modal";

/**
 * Legacy compatibility alias forwarding directly to consolidated WCAG 2.2 AA Modal.
 * Eliminates duplicate focus-trap implementation (M4.6 Consolidation).
 */
export default function FocusTrapModal2026(props) {
  return <Modal {...props} />;
}
