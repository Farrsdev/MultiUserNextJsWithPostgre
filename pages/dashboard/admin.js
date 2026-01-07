// AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState({
        name: 'Administrator',
        role: 'admin',
        email: 'admin@example.com'
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        revenue: 0,
        pendingApprovals: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate authentication check
        const checkAuth = () => {
            // For demo purposes, we'll assume user is logged in as admin
            // In real app, you would check cookies, localStorage, or API
            const userRole = localStorage.getItem('userRole') || 'admin';
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || true; // Default to true for demo
            
            if (!isLoggedIn) {
                router.push('/login');
                return;
            }
            
            if (userRole !== 'admin') {
                router.push('/dashboard/user');
                return;
            }
            
            setIsAuthenticated(true);
            setIsAdmin(true);
            
            // Set user data
            setUser({
                name: localStorage.getItem('userName') || 'Administrator',
                role: userRole,
                email: localStorage.getItem('userEmail') || 'admin@example.com'
            });
        };

        checkAuth();

        // Simulate loading data
        const timer = setTimeout(() => {
            setStats({
                totalUsers: 1542,
                activeUsers: 1248,
                revenue: 25480,
                pendingApprovals: 12
            });
            
            setRecentActivity([
                { id: 1, user: 'John Doe', action: 'Account created', time: '2 minutes ago' },
                { id: 2, user: 'Jane Smith', action: 'Payment received', time: '15 minutes ago' },
                { id: 3, user: 'Bob Wilson', action: 'Profile updated', time: '1 hour ago' },
                { id: 4, user: 'Alice Brown', action: 'Support ticket submitted', time: '2 hours ago' },
                { id: 5, user: 'Charlie Davis', action: 'Account suspended', time: '3 hours ago' }
            ]);
            
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [router]);

    const handleLogout = () => {
        // Clear auth data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        
        // Redirect to login
        router.push('/login');
    };

    const handleDemoLogin = () => {
        // For demo: simulate login as admin
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userName', 'Demo Admin');
        localStorage.setItem('userEmail', 'admin@demo.com');
        
        setUser({
            name: 'Demo Admin',
            role: 'admin',
            email: 'admin@demo.com'
        });
        
        setIsAuthenticated(true);
        setIsAdmin(true);
    };

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading dashboard...</p>
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) {
        return (
            <div style={styles.authContainer}>
                <div style={styles.authCard}>
                    <h2 style={styles.authTitle}>Access Required</h2>
                    <p style={styles.authText}>You need admin privileges to access this page.</p>
                    <div style={styles.authButtons}>
                        <button 
                            onClick={handleDemoLogin}
                            style={styles.loginButton}
                        >
                            Login as Demo Admin
                        </button>
                        <button 
                            onClick={() => router.push('/login')}
                            style={styles.backButton}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <h1 style={styles.headerTitle}>Admin Dashboard</h1>
                        <p style={styles.headerSubtitle}>Welcome back, {user?.name || 'Admin'}!</p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.userInfo}>
                            <div style={styles.avatar}>
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div style={styles.userDetails}>
                                <span style={styles.userName}>{user?.name || 'Administrator'}</span>
                                <span style={styles.userRole}>Admin</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            style={styles.logoutButton}
                        >
                            <svg style={styles.logoutIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard} className="stat-card">
                    <div style={{...styles.statIcon, ...styles.statIconUsers}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                    </div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statTitle}>Total Users</h3>
                        <p style={styles.statValue}>{stats.totalUsers.toLocaleString()}</p>
                        <p style={styles.statChange}>+12% from last month</p>
                    </div>
                </div>

                <div style={styles.statCard} className="stat-card">
                    <div style={{...styles.statIcon, ...styles.statIconActive}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statTitle}>Active Users</h3>
                        <p style={styles.statValue}>{stats.activeUsers.toLocaleString()}</p>
                        <p style={styles.statChange}>+8% from last week</p>
                    </div>
                </div>

                <div style={styles.statCard} className="stat-card">
                    <div style={{...styles.statIcon, ...styles.statIconRevenue}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statTitle}>Revenue</h3>
                        <p style={styles.statValue}>${stats.revenue.toLocaleString()}</p>
                        <p style={styles.statChange}>+24% from last month</p>
                    </div>
                </div>

                <div style={styles.statCard} className="stat-card">
                    <div style={{...styles.statIcon, ...styles.statIconPending}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={styles.statContent}>
                        <h3 style={styles.statTitle}>Pending Approvals</h3>
                        <p style={styles.statValue}>{stats.pendingApprovals}</p>
                        <p style={styles.statChange}>Requires attention</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.mainContent}>
                {/* Recent Activity */}
                <div style={styles.activitySection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Recent Activity</h2>
                        <button style={styles.viewAllButton} className="view-all-button">View All</button>
                    </div>
                    <div style={styles.activityList}>
                        {recentActivity.map(activity => (
                            <div key={activity.id} style={styles.activityItem}>
                                <div style={styles.activityIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor">
                                        <circle cx="10" cy="10" r="5" />
                                    </svg>
                                </div>
                                <div style={styles.activityContent}>
                                    <p style={styles.activityText}>
                                        <strong>{activity.user}</strong> {activity.action}
                                    </p>
                                    <span style={styles.activityTime}>{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={styles.actionsSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Quick Actions</h2>
                    </div>
                    <div style={styles.actionsGrid}>
                        <button style={styles.actionButton} className="action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                            Add User
                        </button>
                        <button style={styles.actionButton} className="action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Approve Requests
                        </button>
                        <button style={styles.actionButton} className="action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            Manage Content
                        </button>
                        <button style={styles.actionButton} className="action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Settings
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
        backgroundColor: '#f3f4f6'
    },
    authContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '20px'
    },
    authCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
    },
    authTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 16px 0'
    },
    authText: {
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 32px 0',
        lineHeight: '1.5'
    },
    authButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    loginButton: {
        padding: '14px 20px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    backButton: {
        padding: '14px 20px',
        backgroundColor: 'transparent',
        color: '#2563eb',
        border: '1px solid #2563eb',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '5px solid #e5e7eb',
        borderTop: '5px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    },
    loadingText: {
        fontSize: '18px',
        color: '#6b7280',
        fontWeight: '500'
    },
    header: {
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 0'
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerLeft: {},
    headerTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: '0'
    },
    headerSubtitle: {
        fontSize: '14px',
        color: '#6b7280',
        margin: '5px 0 0 0'
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '30px'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '18px'
    },
    userDetails: {
        display: 'flex',
        flexDirection: 'column'
    },
    userName: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#111827'
    },
    userRole: {
        fontSize: '12px',
        color: '#6b7280'
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s'
    },
    logoutIcon: {
        width: '16px',
        height: '16px'
    },
    statsGrid: {
        maxWidth: '1200px',
        margin: '30px auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    statIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statIconUsers: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8'
    },
    statIconActive: {
        backgroundColor: '#dcfce7',
        color: '#16a34a'
    },
    statIconRevenue: {
        backgroundColor: '#fef3c7',
        color: '#d97706'
    },
    statIconPending: {
        backgroundColor: '#fee2e2',
        color: '#dc2626'
    },
    statContent: {
        flex: 1
    },
    statTitle: {
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 8px 0',
        fontWeight: '500'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 4px 0'
    },
    statChange: {
        fontSize: '12px',
        color: '#6b7280',
        margin: '0'
    },
    mainContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '30px'
    },
    activitySection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    actionsSection: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        margin: '0'
    },
    viewAllButton: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: '#2563eb',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    activityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 0',
        borderBottom: '1px solid #f3f4f6'
    },
    activityIcon: {
        color: '#2563eb',
        flexShrink: 0
    },
    activityContent: {
        flex: 1
    },
    activityText: {
        margin: '0 0 4px 0',
        color: '#374151',
        fontSize: '14px'
    },
    activityTime: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
    },
    actionButton: {
        padding: '20px',
        backgroundColor: '#f9fafb',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s'
    }
};

// Add animation for spinner
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .view-all-button:hover {
            background-color: #f3f4f6;
        }
        
        .action-button:hover {
            background-color: #f0f9ff;
            border-color: #2563eb;
            color: #2563eb;
        }
        
        .logout-button:hover {
            background-color: #dc2626;
        }
    `;
    document.head.appendChild(style);
}