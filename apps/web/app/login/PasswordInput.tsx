"use client";

import { useState } from "react";

export default function PasswordInput() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input 
        name="password" 
        type={show ? "text" : "password"} 
        placeholder="Dashboard password" 
        required 
        style={{ width: "100%", paddingRight: "40px" }}
      />
      <button 
        type="button" 
        onClick={() => setShow(!show)}
        style={{ 
          position: "absolute", 
          right: "12px", 
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent", 
          border: "none", 
          cursor: "pointer",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          margin: 0,
          zIndex: 10
        }}
        tabIndex={-1}
      >
        {show ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
}
