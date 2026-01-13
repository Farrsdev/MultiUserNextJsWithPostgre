"use client";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const { data: session, status } = useSession();
const [isRedirecting, setIsRedirecting] = useState(false);

    const router = useRouter();

    useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.role) {
        setIsRedirecting(true);

        const role = session.user.role;

        if (role === "admin") {
            router.replace("/dashboard/admin");
        } else if (role === "user") {
            router.replace("/dashboard/user");
        } else {
            router.replace("/dashboard");
        }
    }
}, [session, status, router]);


    useEffect(() => {
        if (typeof document !== "undefined") {
            const style = document.createElement("style");
            style.innerHTML = `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
            document.head.appendChild(style);

            return () => {
                document.head.removeChild(style);
            };
        }
    }, []);


    useEffect(() => {
        if (email) setEmailError("");
        if (password) setPasswordError("");
        setError("");
    }, [email, password]);

    const validateForm = () => {
        let isValid = true;

        if (!email) {
            setEmailError("Email is required");
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Email is invalid");
            isValid = false;
        }

        if (!password) {
            setPasswordError("Password is required");
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            isValid = false;
        }

        return isValid;
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (!res?.ok) {
                setError(res?.error || "Login failed");
            }

            if (res?.ok) {
                // Wait a bit for session to update
                await new Promise((resolve) => setTimeout(resolve, 500));

                const session = await getSession();
                const userRole = session?.user?.role;

                // Redirect based on role
                if (userRole === 'admin') {
                    router.push("/dashboard/admin");
                } else if (userRole === 'user') {
                    router.push("/dashboard/user");
                } else {
                    router.push("/dashboard");
                }
            } else {
                setError(res?.error || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Login error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    if (status === "loading" || isRedirecting) {
        return (
            <div style={styles.container}>
                <div style={{ textAlign: "center" }}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>
                        Checking your session...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        Welcome Back
                    </h2>
                    <p style={styles.subtitle}>
                        Sign in to your account
                    </p>
                </div>

                <div style={styles.formContainer}>
                    <form style={styles.form} onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label htmlFor="email" style={styles.label}>
                                Email Address
                            </label>
                            <div style={styles.inputContainer}>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    style={{
                                        ...styles.input,
                                        borderColor: emailError ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {emailError && (
                                    <p style={styles.errorText}>{emailError}</p>
                                )}
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="password" style={styles.label}>
                                Password
                            </label>
                            <div style={styles.inputContainer}>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    style={{
                                        ...styles.input,
                                        borderColor: passwordError ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {passwordError && (
                                    <p style={styles.errorText}>{passwordError}</p>
                                )}
                            </div>
                        </div>

                        <div style={styles.optionsContainer}>
                            <div style={styles.rememberContainer}>
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    style={styles.checkbox}
                                />
                                <label htmlFor="remember-me" style={styles.checkboxLabel}>
                                    Remember me
                                </label>
                            </div>

                            <div style={styles.forgotPassword}>
                                <Link
                                    href="/forgot-password"
                                    style={styles.link}
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div style={styles.errorContainer}>
                                <div style={styles.errorContent}>
                                    <div style={styles.errorIcon}>
                                        <svg style={styles.errorIconSvg} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div style={styles.errorMessage}>
                                        <h3 style={styles.errorTitle}>
                                            {error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    ...styles.submitButton,
                                    backgroundColor: isLoading ? '#60a5fa' : '#2563eb',
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <svg style={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path style={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>

                    <div style={styles.footer}>
                        <div style={styles.dividerContainer}>
                            <div style={styles.divider}></div>
                            <div style={styles.dividerTextContainer}>
                                <span style={styles.dividerText}>Or</span>
                            </div>
                        </div>

                        <div style={styles.signupContainer}>
                            <p style={styles.signupText}>
                                Don't have an account?{' '}
                                <Link
                                    href="/register"
                                    style={styles.link}
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    loadingSpinner: {
        width: "3rem",
        height: "3rem",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #2563eb",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto",
    },

    loadingText: {
        marginTop: "1rem",
        fontSize: "0.875rem",
        color: "#374151",
    },

    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f3f4f6 100%)',
        padding: '3rem 1rem'
    },
    wrapper: {
        maxWidth: '28rem',
        width: '100%'
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem'
    },
    title: {
        marginTop: '1.5rem',
        fontSize: '1.875rem',
        fontWeight: '800',
        color: '#111827'
    },
    subtitle: {
        marginTop: '0.5rem',
        fontSize: '0.875rem',
        color: '#4b5563'
    },
    formContainer: {
        backgroundColor: 'white',
        padding: '2rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '0.25rem'
    },
    inputContainer: {
        marginTop: '0.25rem'
    },
    input: {
        boxSizing: 'border-box', // 🔥 INI KUNCI NYA
        appearance: 'none',
        display: 'block',
        width: '100%',
        padding: '0.5rem 0.75rem',
        border: '1px solid',
        borderRadius: '0.375rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    inputFocus: {
        outline: 'none',
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    errorText: {
        marginTop: '0.25rem',
        fontSize: '0.875rem',
        color: '#dc2626'
    },
    optionsContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    rememberContainer: {
        display: 'flex',
        alignItems: 'center'
    },
    checkbox: {
        height: '1rem',
        width: '1rem',
        color: '#2563eb',
        borderColor: '#d1d5db',
        borderRadius: '0.25rem'
    },
    checkboxLabel: {
        marginLeft: '0.5rem',
        fontSize: '0.875rem',
        color: '#111827'
    },
    forgotPassword: {
        fontSize: '0.875rem'
    },
    link: {
        fontWeight: '500',
        color: '#2563eb',
        textDecoration: 'none'
    },
    linkHover: {
        color: '#1d4ed8'
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderRadius: '0.375rem',
        padding: '1rem'
    },
    errorContent: {
        display: 'flex'
    },
    errorIcon: {
        flexShrink: 0
    },
    errorIconSvg: {
        height: '1.25rem',
        width: '1.25rem',
        color: '#f87171'
    },
    errorMessage: {
        marginLeft: '0.75rem'
    },
    errorTitle: {
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#991b1b'
    },
    submitButton: {
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'white',
        transition: 'background-color 0.2s'
    },
    submitButtonHover: {
        backgroundColor: '#1d4ed8'
    },
    submitButtonFocus: {
        outline: 'none',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
    },
    spinner: {
        animation: 'spin 1s linear infinite',
        marginRight: '0.75rem',
        height: '1.25rem',
        width: '1.25rem'
    },
    spinnerCircle: {
        opacity: 0.25,
        stroke: 'currentColor'
    },
    spinnerPath: {
        opacity: 0.75,
        fill: 'currentColor'
    },
    footer: {
        marginTop: '1.5rem'
    },
    dividerContainer: {
        position: 'relative'
    },
    divider: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderTop: '1px solid #d1d5db'
    },
    dividerTextContainer: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
    },
    dividerText: {
        padding: '0 0.5rem',
        backgroundColor: 'white',
        fontSize: '0.875rem',
        color: '#6b7280'
    },
    signupContainer: {
        marginTop: '1.5rem',
        textAlign: 'center'
    },
    signupText: {
        fontSize: '0.875rem',
        color: '#6b7280'
    }
};

export default LoginPage;