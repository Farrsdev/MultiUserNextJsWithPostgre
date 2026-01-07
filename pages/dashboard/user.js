// UserPage.jsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function UserPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isUser, setIsUser] = useState(false);
    const [user, setUser] = useState({
        name: 'Lincoln',
        role: 'user',
        email: 'Linc@example.com'
    });
    const [userStats, setUserStats] = useState({
        projects: 0,
        tasks: 0,
        completed: 0,
        points: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate authentication check
        const checkAuth = () => {
            // For demo purposes, we'll assume user is logged in as user
            const userRole = localStorage.getItem('userRole') || 'user';
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || true; // Default to true for demo
            
            if (!isLoggedIn) {
                router.push('/login');
                return;
            }
            
            if (userRole !== 'user') {
                router.push('/dashboard/admin');
                return;
            }
            
            setIsAuthenticated(true);
            setIsUser(true);
            
            // Set user data
            setUser({
                name: localStorage.getItem('userName') || 'Lincoln',
                role: userRole,
                email: localStorage.getItem('userEmail') || 'user@example.com'
            });
        };

        checkAuth();

        // Simulate loading data
        const timer = setTimeout(() => {
            setUserStats({
                projects: 5,
                tasks: 12,
                completed: 8,
                points: 2450
            });
            
            setRecentProjects([
                { id: 1, name: 'Website Redesign', progress: 75, deadline: '2024-02-15' },
                { id: 2, name: 'Mobile App Development', progress: 30, deadline: '2024-03-01' },
                { id: 3, name: 'API Integration', progress: 100, deadline: '2024-01-30' },
                { id: 4, name: 'UI/UX Design', progress: 50, deadline: '2024-02-28' }
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
        // For demo: simulate login as user
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userName', 'Demo User');
        localStorage.setItem('userEmail', 'user@demo.com');
        
        setUser({
            name: 'Demo User',
            role: 'user',
            email: 'user@demo.com'
        });
        
        setIsAuthenticated(true);
        setIsUser(true);
    };

    if (isLoading) {
        return (
            <div style={userStyles.loadingContainer}>
                <div style={userStyles.spinner}></div>
                <p style={userStyles.loadingText}>Loading dashboard...</p>
            </div>
        );
    }

    if (!isAuthenticated || !isUser) {
        return (
            <div style={userStyles.authContainer}>
                <div style={userStyles.authCard}>
                    <h2 style={userStyles.authTitle}>Access Required</h2>
                    <p style={userStyles.authText}>Please login as a user to access this page.</p>
                    <div style={userStyles.authButtons}>
                        <button 
                            onClick={handleDemoLogin}
                            style={userStyles.loginButton}
                        >
                            Login as Demo User
                        </button>
                        <button 
                            onClick={() => router.push('/login')}
                            style={userStyles.backButton}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={userStyles.container}>
            {/* Header */}
            <header style={userStyles.header}>
                <div style={userStyles.headerContent}>
                    <div style={userStyles.headerLeft}>
                        <h1 style={userStyles.headerTitle}>User Dashboard</h1>
                        <p style={userStyles.headerSubtitle}>Welcome back, {user?.name || 'User'}!</p>
                    </div>
                    <div style={userStyles.headerRight}>
                        <div style={userStyles.userInfo}>
                            <div style={userStyles.avatar}>
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={userStyles.userDetails}>
                                <span style={userStyles.userName}>{user?.name || 'User'}</span>
                                <span style={userStyles.userRole}>Member</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            style={userStyles.logoutButton}
                            className="user-logout-button"
                        >
                            <svg style={userStyles.logoutIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={userStyles.statsGrid}>
                <div style={userStyles.statCard} className="user-stat-card">
                    <div style={{...userStyles.statIcon, ...userStyles.statIconProjects}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={userStyles.statContent}>
                        <h3 style={userStyles.statTitle}>Active Projects</h3>
                        <p style={userStyles.statValue}>{userStats.projects}</p>
                        <p style={userStyles.statChange}>+2 this month</p>
                    </div>
                </div>

                <div style={userStyles.statCard} className="user-stat-card">
                    <div style={{...userStyles.statIcon, ...userStyles.statIconTasks}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={userStyles.statContent}>
                        <h3 style={userStyles.statTitle}>Total Tasks</h3>
                        <p style={userStyles.statValue}>{userStats.tasks}</p>
                        <p style={userStyles.statChange}>{userStats.completed} completed</p>
                    </div>
                </div>

                <div style={userStyles.statCard} className="user-stat-card">
                    <div style={{...userStyles.statIcon, ...userStyles.statIconProgress}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={userStyles.statContent}>
                        <h3 style={userStyles.statTitle}>Completion Rate</h3>
                        <p style={userStyles.statValue}>{Math.round((userStats.completed / userStats.tasks) * 100)}%</p>
                        <p style={userStyles.statChange}>Great work!</p>
                    </div>
                </div>

                <div style={userStyles.statCard} className="user-stat-card">
                    <div style={{...userStyles.statIcon, ...userStyles.statIconPoints}}>
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.2 6.5 10.266a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div style={userStyles.statContent}>
                        <h3 style={userStyles.statTitle}>Reward Points</h3>
                        <p style={userStyles.statValue}>{userStats.points.toLocaleString()}</p>
                        <p style={userStyles.statChange}>+150 this week</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={userStyles.mainContent}>
                {/* Recent Projects */}
                <div style={userStyles.projectsSection}>
                    <div style={userStyles.sectionHeader}>
                        <h2 style={userStyles.sectionTitle}>Recent Projects</h2>
                        <button style={userStyles.newProjectButton} className="new-project-button">
                            <svg style={userStyles.plusIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            New Project
                        </button>
                    </div>
                    <div style={userStyles.projectsGrid}>
                        {recentProjects.map(project => (
                            <div key={project.id} style={userStyles.projectCard} className="project-card">
                                <div style={userStyles.projectHeader}>
                                    <h3 style={userStyles.projectTitle}>{project.name}</h3>
                                    <span style={userStyles.projectDeadline}>
                                        Due: {new Date(project.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={userStyles.progressContainer}>
                                    <div style={userStyles.progressBar}>
                                        <div 
                                            style={{
                                                ...userStyles.progressFill,
                                                width: `${project.progress}%`,
                                                backgroundColor: project.progress === 100 ? '#10b981' : 
                                                               project.progress > 75 ? '#3b82f6' :
                                                               project.progress > 50 ? '#f59e0b' : '#ef4444'
                                            }}
                                        ></div>
                                    </div>
                                    <span style={userStyles.progressText}>{project.progress}%</span>
                                </div>
                                <div style={userStyles.projectActions}>
                                    <button style={userStyles.projectButton} className="project-button">
                                        <svg viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button style={userStyles.projectButton} className="project-button">
                                        <svg viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Update
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={userStyles.actionsSection}>
                    <div style={userStyles.sectionHeader}>
                        <h2 style={userStyles.sectionTitle}>Quick Actions</h2>
                    </div>
                    <div style={userStyles.actionsGrid}>
                        <button style={userStyles.actionButton} className="user-action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create Task
                        </button>
                        <button style={userStyles.actionButton} className="user-action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            View Reports
                        </button>
                        <button style={userStyles.actionButton} className="user-action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            Profile Settings
                        </button>
                        <button style={userStyles.actionButton} className="user-action-button">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const userStyles = {
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
        backgroundColor: '#7c3aed',
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
        color: '#7c3aed',
        border: '1px solid #7c3aed',
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
        borderTop: '5px solid #7c3aed',
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
        backgroundColor: '#7c3aed',
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
    statIconProjects: {
        backgroundColor: '#ede9fe',
        color: '#7c3aed'
    },
    statIconTasks: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8'
    },
    statIconProgress: {
        backgroundColor: '#dcfce7',
        color: '#16a34a'
    },
    statIconPoints: {
        backgroundColor: '#fef3c7',
        color: '#d97706'
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
    projectsSection: {
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
    newProjectButton: {
        padding: '10px 20px',
        backgroundColor: '#7c3aed',
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
    plusIcon: {
        width: '16px',
        height: '16px'
    },
    projectsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
    },
    projectCard: {
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s'
    },
    projectHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px'
    },
    projectTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        margin: '0'
    },
    projectDeadline: {
        fontSize: '12px',
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        padding: '4px 8px',
        borderRadius: '6px'
    },
    progressContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
    },
    progressBar: {
        flex: 1,
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.3s ease'
    },
    progressText: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        minWidth: '40px'
    },
    projectActions: {
        display: 'flex',
        gap: '12px'
    },
    projectButton: {
        flex: 1,
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
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

// Add animation for UserPage spinner
if (typeof document !== 'undefined') {
    const userStyle = document.createElement('style');
    userStyle.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .user-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .new-project-button:hover {
            background-color: #6d28d9;
        }
        
        .project-card:hover {
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-color: #c7d2fe;
        }
        
        .user-action-button:hover {
            background-color: #f0f9ff;
            border-color: #2563eb;
            color: #2563eb;
        }
        
        .user-logout-button:hover {
            background-color: #dc2626;
        }
        
        .project-button:hover {
            background-color: #f3f4f6;
            border-color: #2563eb;
            color: #2563eb;
        }
    `;
    document.head.appendChild(userStyle);
}

export default UserPage;