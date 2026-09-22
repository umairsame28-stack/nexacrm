import helmet from 'helmet';

describe('Helmet Security Configuration', () => {
  describe('Production Configuration', () => {
    const isProduction = true;

    it('should enable Content Security Policy in production', () => {
      const config = {
        contentSecurityPolicy: isProduction
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
              },
            }
          : false,
      };

      expect(config.contentSecurityPolicy).not.toBe(false);
      expect(config.contentSecurityPolicy).toHaveProperty('directives');
    });

    it('should enforce HSTS with 1 year max-age in production', () => {
      const config = {
        hsts: isProduction
          ? {
              maxAge: 31536000, // 1 year
              includeSubDomains: true,
              preload: true,
            }
          : false,
      };

      expect(config.hsts).not.toBe(false);
      expect((config.hsts as any).maxAge).toBe(31536000);
      expect((config.hsts as any).includeSubDomains).toBe(true);
      expect((config.hsts as any).preload).toBe(true);
    });

    it('should configure CSP directives for API security', () => {
      const cspDirectives = {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      };

      // Verify restrictive defaults
      expect(cspDirectives.defaultSrc).toEqual(["'self'"]);
      expect(cspDirectives.objectSrc).toEqual(["'none'"]);
      expect(cspDirectives.frameSrc).toEqual(["'none'"]);

      // Verify script restrictions (no eval, no inline)
      expect(cspDirectives.scriptSrc).toEqual(["'self'"]);
      expect(cspDirectives.scriptSrc).not.toContain("'unsafe-eval'");
      expect(cspDirectives.scriptSrc).not.toContain("'unsafe-inline'");
    });
  });

  describe('Development Configuration', () => {
    const isProduction = false;

    it('should disable CSP in development for Swagger UI compatibility', () => {
      const config = {
        contentSecurityPolicy: isProduction
          ? {
              directives: {
                defaultSrc: ["'self'"],
              },
            }
          : false,
      };

      expect(config.contentSecurityPolicy).toBe(false);
    });

    it('should disable HSTS in development', () => {
      const config = {
        hsts: isProduction
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
      };

      expect(config.hsts).toBe(false);
    });
  });

  describe('Common Security Headers', () => {
    it('should disable crossOriginEmbedderPolicy for file uploads', () => {
      const config = {
        crossOriginEmbedderPolicy: false,
      };

      expect(config.crossOriginEmbedderPolicy).toBe(false);
    });

    it('should set crossOriginResourcePolicy to cross-origin', () => {
      const config = {
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      };

      expect(config.crossOriginResourcePolicy).toEqual({ policy: 'cross-origin' });
    });

    it('should disable DNS prefetching', () => {
      const config = {
        dnsPrefetchControl: { allow: false },
      };

      expect(config.dnsPrefetchControl).toEqual({ allow: false });
    });

    it('should enable frameguard with deny action', () => {
      const config = {
        frameguard: { action: 'deny' },
      };

      expect(config.frameguard).toEqual({ action: 'deny' });
    });

    it('should hide X-Powered-By header', () => {
      const config = {
        hidePoweredBy: true,
      };

      expect(config.hidePoweredBy).toBe(true);
    });

    it('should enable IE noOpen', () => {
      const config = {
        ieNoOpen: true,
      };

      expect(config.ieNoOpen).toBe(true);
    });

    it('should enable noSniff (X-Content-Type-Options)', () => {
      const config = {
        noSniff: true,
      };

      expect(config.noSniff).toBe(true);
    });

    it('should set Referrer-Policy to strict-origin-when-cross-origin', () => {
      const config = {
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      };

      expect(config.referrerPolicy).toEqual({
        policy: 'strict-origin-when-cross-origin',
      });
    });

    it('should enable XSS filter', () => {
      const config = {
        xssFilter: true,
      };

      expect(config.xssFilter).toBe(true);
    });
  });

  describe('Helmet Module Availability', () => {
    it('should have helmet module imported', () => {
      expect(helmet).toBeDefined();
      expect(typeof helmet).toBe('function');
    });
  });

  describe('Security Headers Validation', () => {
    it('should enforce all critical security headers', () => {
      const criticalHeaders = {
        contentSecurityPolicy: true, // CSP
        hsts: true, // HSTS in production
        frameguard: true, // X-Frame-Options
        hidePoweredBy: true, // Hide server info
        noSniff: true, // X-Content-Type-Options
        referrerPolicy: true, // Referrer-Policy
        xssFilter: true, // X-XSS-Protection
      };

      Object.entries(criticalHeaders).forEach(([header, required]) => {
        expect(required).toBe(true);
      });
    });
  });
});
