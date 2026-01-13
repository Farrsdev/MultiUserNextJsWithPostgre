"use client";
export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: "40px 32px",
        borderRadius: 16,
        textAlign: "center",
        maxWidth: 480,
        width: "100%",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }}>
        {/* Icon */}
        <div style={{
          width: 80,
          height: 80,
          background: "linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          color: "white",
          fontSize: 36,
          fontWeight: "bold"
        }}>
          403
        </div>
        
        {/* Title */}
        <h1 style={{ 
          fontSize: 28, 
          color: "#1f2937",
          marginBottom: 12,
          fontWeight: 600
        }}>
          Akses Dibatasi
        </h1>
        
        {/* Main Message */}
        <p style={{ 
          color: "#6b7280",
          fontSize: 16,
          lineHeight: 1.6,
          marginBottom: 24
        }}>
          Halaman ini hanya dapat diakses oleh <strong style={{color: "#dc2626"}}>User</strong>
        </p>
        
        {/* Error Details Box */}
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 8,
          padding: "16px",
          marginBottom: 32,
          textAlign: "left"
        }}>
          <div style={{ 
            color: "#991b1b",
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span style={{fontSize: 18}}>⚠️</span>
            Detail Error:
          </div>
          <div style={{ 
            color: "#7f1d1d",
            fontSize: 13,
            fontFamily: "monospace",
            lineHeight: 1.5
          }}>
            • Kode: <code style={{background: "#fee2e2", padding: "2px 6px", borderRadius: 4}}>LOGIN_REQUIRED</code><br/>
            • Status: <code style={{background: "#fee2e2", padding: "2px 6px", borderRadius: 4}}>403 Forbidden</code><br/>
            • Hak Akses: <code style={{background: "#fee2e2", padding: "2px 6px", borderRadius: 4}}>Authenticated User</code><br/>
            • Waktu: <code style={{background: "#fee2e2", padding: "2px 6px", borderRadius: 4}}>{new Date().toLocaleTimeString()}</code>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <a 
            href="/login" 
            style={{
              background: "#3b82f6",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 500,
              transition: "all 0.2s",
              border: "none",
              cursor: "pointer",
              display: "inline-block"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
          >
            🔐 Login Sekarang
          </a>
          
          <a 
            href="/" 
            style={{
              background: "white",
              color: "#4b5563",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 500,
              transition: "all 0.2s",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              display: "inline-block"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "white"}
          >
            ← Kembali ke Beranda
          </a>
        </div>
        
       
      </div>
    </div>
  );
}