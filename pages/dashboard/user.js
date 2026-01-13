"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  
    const userName = session?.user?.name || "User";
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }

    if (session && session.user.role !== "user") {
      router.replace("/error/403/user");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "user") {
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
                    <h1 style={styles.title}>My Dashboard</h1>
                    <p style={styles.subtitle}>Welcome back, {userName}!</p>
                </div>
                <div style={styles.headerActions}>
                    <div style={styles.userBadge}>USER</div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>📁</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Projects</p>
                        <p style={styles.statValue}>5</p>
                    </div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Completed</p>
                        <p style={styles.statValue}>8</p>
                    </div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statIcon}>🎯</div>
                    <div style={styles.statContent}>
                        <p style={styles.statLabel}>Progress</p>
                        <p style={styles.statValue}>67%</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>My Projects</h3>
                    <div style={styles.projectsList}>
                        {[
                            { name: 'Website Redesign', progress: 75, deadline: 'Feb 15' },
                            { name: 'Mobile App Dev', progress: 30, deadline: 'Mar 1' },
                            { name: 'API Integration', progress: 100, deadline: 'Jan 30' },
                            { name: 'UI/UX Design', progress: 50, deadline: 'Feb 28' },
                        ].map((project, index) => (
                            <div key={index} style={styles.projectCard}>
                                <div style={styles.projectHeader}>
                                    <h4 style={styles.projectName}>{project.name}</h4>
                                    <span style={styles.projectDeadline}>Due: {project.deadline}</span>
                                </div>
                                <div style={styles.progressBar}>
                                    <div 
                                        style={{
                                            ...styles.progressFill,
                                            width: `${project.progress}%`
                                        }}
                                    ></div>
                                </div>
                                <div style={styles.progressLabel}>
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div style={styles.projectActions}>
                                    <button style={styles.smallBtn}>View</button>
                                    <button style={styles.smallBtn}>Edit</button>
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
                            New Task
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>📊</span>
                            Reports
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>⚙️</span>
                            Settings
                        </button>
                        <button style={styles.actionBtn}>
                            <span style={styles.actionIcon}>🔼</span>
                            Upgrade
                        </button>
                    </div>
                    
                    <div style={styles.userInfoCard}>
                        <h4 style={styles.infoTitle}>Account Info</h4>
                        <div style={styles.infoRow}>
                            <span>Name:</span>
                            <span>{userName}</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Role:</span>
                            <span>Member</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span>Status:</span>
                            <span style={styles.statusActive}>Active</span>
                        </div>
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
        border: '3px solid rgba(124, 58, 237, 0.2)',
        borderTop: '3px solid #7c3aed',
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
    userIcon: {
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
        backgroundColor: '#7c3aed',
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
        backgroundColor: '#7c3aed',
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
    projectsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    projectCard: {
        border: '1px solid #eaeaea',
        borderRadius: '10px',
        padding: '20px'
    },
    projectHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
    },
    projectName: {
        margin: '0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#333'
    },
    projectDeadline: {
        fontSize: '12px',
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        padding: '4px 8px',
        borderRadius: '6px'
    },
    progressBar: {
        height: '6px',
        backgroundColor: '#eaeaea',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '8px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7c3aed',
        borderRadius: '3px'
    },
    progressLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#666',
        marginBottom: '15px'
    },
    projectActions: {
        display: 'flex',
        gap: '10px'
    },
    smallBtn: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #eaeaea',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer'
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        marginBottom: '25px'
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
    },
    userInfoCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid #eaeaea'
    },
    infoTitle: {
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 15px 0',
        color: '#333'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #eee'
    },
    statusActive: {
        color: '#10b981',
        fontWeight: '600'
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
            background-color: #6d28d9;
        }
        
        .logout-btn:hover {
            background-color: #ff4444;
            color: white;
        }
        
        .action-btn:hover {
            background-color: #7c3aed;
            color: white;
            border-color: #7c3aed;
        }
        
        .stat-box:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        
        .small-btn:hover {
            background-color: #7c3aed;
            color: white;
            border-color: #7c3aed;
        }
        
        .project-card:hover {
            border-color: #7c3aed;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
        }
    `;
    document.head.appendChild(style);
}

export default UserPage;