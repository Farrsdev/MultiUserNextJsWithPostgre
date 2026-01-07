import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Link from "next/link";

function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState({});

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
        validateForm();
    }, [formData]);

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
            newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!/(?=.*\d)/.test(formData.password)) {
            newErrors.password = "Password must contain at least one number";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setErrorMessage("");

        if (!validateForm()) {
            // Mark all fields as touched to show errors
            setTouched({
                name: true,
                email: true,
                password: true,
                confirmPassword: true
            });
            return;
        }

        setIsLoading(true);

        const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
        };

        try {
            const res = await fetch("/api/user/create", {
                method: "POST",
                body: JSON.stringify(userData),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            // Registration successful
            alert("Registration successful! Redirecting to login...");
            router.push("/login");

        } catch (error) {
            console.error("Registration error:", error.message);
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.wrapper}>
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        Create your account
                    </h2>
                
                </div>

                <div style={styles.formContainer}>
                    <form style={styles.form} onSubmit={handleSubmit}>
                        <div style={styles.formGroup}>
                            <label htmlFor="name" style={styles.label}>
                                Full Name
                            </label>
                            <div style={styles.inputContainer}>
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    style={{
                                        ...styles.input,
                                        borderColor: touched.name && errors.name ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur("name")}
                                />
                                {touched.name && errors.name && (
                                    <p style={styles.errorText}>{errors.name}</p>
                                )}
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="email" style={styles.label}>
                                Email Address
                            </label>
                            <div style={styles.inputContainer}>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    style={{
                                        ...styles.input,
                                        borderColor: touched.email && errors.email ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur("email")}
                                />
                                {touched.email && errors.email && (
                                    <p style={styles.errorText}>{errors.email}</p>
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
                                    type="password"
                                    autoComplete="new-password"
                                    style={{
                                        ...styles.input,
                                        borderColor: touched.password && errors.password ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur("password")}
                                />
                                {touched.password && errors.password && (
                                    <p style={styles.errorText}>{errors.password}</p>
                                )}
                                <div style={styles.passwordRequirements}>
                                    Password must contain:
                                    <ul style={styles.requirementsList}>
                                        <li style={{
                                            ...styles.requirementItem,
                                            color: formData.password.length >= 6 ? '#059669' : '#6b7280'
                                        }}>
                                            At least 6 characters
                                        </li>
                                        <li style={{
                                            ...styles.requirementItem,
                                            color: /(?=.*[A-Z])/.test(formData.password) ? '#059669' : '#6b7280'
                                        }}>
                                            One uppercase letter
                                        </li>
                                        <li style={{
                                            ...styles.requirementItem,
                                            color: /(?=.*\d)/.test(formData.password) ? '#059669' : '#6b7280'
                                        }}>
                                            One number
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor="confirmPassword" style={styles.label}>
                                Confirm Password
                            </label>
                            <div style={styles.inputContainer}>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    style={{
                                        ...styles.input,
                                        borderColor: touched.confirmPassword && errors.confirmPassword ? '#fca5a5' : '#d1d5db'
                                    }}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur("confirmPassword")}
                                />
                                {touched.confirmPassword && errors.confirmPassword && (
                                    <p style={styles.errorText}>{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        {errorMessage && (
                            <div style={styles.errorAlert}>
                                <div style={styles.errorAlertContent}>
                                    <div style={styles.errorIcon}>
                                        <svg style={styles.errorIconSvg} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div style={styles.errorMessageContainer}>
                                        <h3 style={styles.errorMessageText}>{errorMessage}</h3>
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
                                    backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <svg style={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path style={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </form>

                    <div style={styles.footer}>
                        <div style={styles.dividerContainer}>
                            <div style={styles.divider}></div>
                            <div style={styles.dividerTextContainer}>
                                <span style={styles.dividerText}>Already have an account?</span>
                            </div>
                        </div>

                        <div style={styles.loginContainer}>
                            <Link
                                href="/login"
                                style={styles.link}
                            >
                                Sign in instead
                            </Link>
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
    errorText: {
        marginTop: '0.25rem',
        fontSize: '0.875rem',
        color: '#dc2626'
    },
    passwordRequirements: {
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: '#6b7280'
    },
    requirementsList: {
        marginTop: '0.25rem',
        listStyleType: 'disc',
        paddingLeft: '1rem'
    },
    requirementItem: {
        marginTop: '0.125rem'
    },
    errorAlert: {
        backgroundColor: '#fef2f2',
        borderRadius: '0.375rem',
        padding: '1rem'
    },
    errorAlertContent: {
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
    errorMessageContainer: {
        marginLeft: '0.75rem'
    },
    errorMessageText: {
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#991b1b'
    },
    termsContainer: {
        display: 'flex',
        alignItems: 'center'
    },
    termsCheckbox: {
        height: '1rem',
        width: '1rem',
        color: '#2563eb',
        borderColor: '#d1d5db',
        borderRadius: '0.25rem'
    },
    termsLabel: {
        marginLeft: '0.5rem',
        fontSize: '0.875rem',
        color: '#111827'
    },
    link: {
        fontWeight: '500',
        color: '#2563eb',
        textDecoration: 'none'
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
        color: 'white'
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
    loginContainer: {
        marginTop: '1.5rem',
        textAlign: 'center'
    }
};

export default RegisterPage;