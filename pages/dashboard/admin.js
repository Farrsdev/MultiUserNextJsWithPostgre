"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
   const { data: session, status } = useSession();
  const router = useRouter();

  // loading session
  if (status === "loading") {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // belum login
  if (!session) {
    router.replace("/login");
    return null;
  }

  // bukan admin
  if (session.user.role !== "admin") {
    router.replace("/error/403/admin");
    return null;
  }

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/login",
    });
  };


    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <p style={styles.subtitle}>Manage your system</p>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.userBadge}>ADMIN</div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Total Users</p>
                        <p style={styles.statValue}>1,542</p>
                    </div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Active Now</p>
                        <p style={styles.statValue}>248</p>
                    </div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>⏳</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Pending</p>
                        <p style={styles.statValue}>12</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Recent Activity</h3>
                    <div style={styles.activityList}>
                        {[
                            { user: 'John Doe', action: 'created account', time: '2 min ago' },
                            { user: 'Jane Smith', action: 'updated profile', time: '15 min ago' },
                            { user: 'Bob Wilson', action: 'submitted ticket', time: '1 hour ago' },
                            { user: 'Alice Brown', action: 'changed password', time: '2 hours ago' },
                        ].map((item, index) => (
                            <div key={index} style={styles.activityItem}>
                                <div style={styles.activityAvatar}>
                                    {item.user.charAt(0)}
                                </div>
                                <div style={styles.activityDetails}>
                                    <p style={styles.activityText}>
                                        <strong>{item.user}</strong> {item.action}
                                    </p>
                                    <span style={styles.activityTime}>{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Quick Actions</h3>
                    <div style={styles.actionsGrid}>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>➕</span>
                            Add User
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>📋</span>
                            Manage Users
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>⚙️</span>
                            Settings
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>📊</span>
                            Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(0, 112, 243, 0.2)',
        borderTop: '3px solid #0070f3',
        borderRadius: '50%',
        marginBottom: '15px'
    },
    authCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px 30px',
        textAlign: 'center',
        maxWidth: '350px',
        margin: '100px auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    },
    lockIcon: {
        fontSize: '48px',
        marginBottom: '20px'
    },
    authTitle: {
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '10px',
        color: '#333'
    },
    authText: {
        color: '#666',
        marginBottom: '30px',
        lineHeight: '1.5'
    },
    authButton: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eaeaea'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#333'
    },
    subtitle: {
        color: '#666',
        margin: '5px 0 0 0'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    userBadge: {
        backgroundColor: '#0070f3',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    logoutBtn: {
        padding: '10px 20px',
        backgroundColor: 'transparent',
        color: '#ff4444',
        border: '1px solid #ff4444',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
    },
    statBox: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    statIcon: {
        fontSize: '32px'
    },
    statContent: {
        flex: 1
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        margin: '0 0 5px 0'
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '700',
        margin: '0',
        color: '#333'
    },
    content: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px'
    },
    section: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 20px 0',
        color: '#333'
    },
    activityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '15px',
        borderBottom: '1px solid #f5f5f5'
    },
    activityAvatar: {
        width: '36px',
        height: '36px',
        backgroundColor: '#0070f3',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '14px'
    },
    activityDetails: {
        flex: 1
    },
    activityText: {
        margin: '0 0 4px 0',
        color: '#333',
        fontSize: '14px'
    },
    activityTime: {
        fontSize: '12px',
        color: '#888'
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px'
    },
    actionBtn: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #eaeaea',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s'
    },
    actionIcon: {
        fontSize: '24px'
    }
};

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .spinner {
            animation: spin 1s linear infinite;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .auth-button:hover {
            background-color: #0058cc;
        }
        
        .logout-btn:hover {
            background-color: #ff4444;
            color: white;
        }
        
        .action-btn:hover {
            background-color: #0070f3;
            color: white;
            border-color: #0070f3;
        }
        
        .stat-box:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}