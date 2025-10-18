# Aura-X VAST Platform - Deployment Guide

## Pre-Deployment Checklist

### Environment Configuration
- [ ] Supabase project URL configured
- [ ] Supabase anon key configured
- [ ] All edge function secrets set
- [ ] Stripe keys configured (production)
- [ ] OpenAI API key set
- [ ] ElevenLabs API key set
- [ ] LOVABLE_API_KEY configured

### Database
- [ ] All migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Vector extension enabled (pgvector)
- [ ] Database backups configured

### Security
- [ ] RLS policies tested
- [ ] Security audit completed
- [ ] Rate limiting configured
- [ ] CORS headers set correctly
- [ ] Authentication flows tested
- [ ] Audit logging enabled

### Performance
- [ ] Audio caching enabled
- [ ] Query caching configured
- [ ] CDN configured
- [ ] Image optimization enabled
- [ ] Lazy loading implemented

---

## Deployment Steps

### 1. Supabase Configuration

#### Database Setup
```sql
-- Verify all migrations are applied
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Should return no rows
```

#### Edge Functions
All edge functions are automatically deployed. Verify deployment:

```bash
# Check function status in Supabase Dashboard
# Navigate to: Edge Functions → View all functions
# Ensure all 18 functions are deployed and active
```

#### Storage Buckets
Create required storage buckets:
- `audio-files` - For audio uploads
- `project-files` - For project data
- `user-avatars` - For profile pictures
- `marketplace-assets` - For marketplace items

### 2. Environment Variables

Create `.env.production`:
```bash
VITE_SUPABASE_URL=https://mywijmtszelyutssormy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

### 3. Build Application

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Deploy Frontend

#### Option A: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option C: Cloudflare Pages
```bash
# Build
npm run build

# Upload dist/ folder to Cloudflare Pages dashboard
```

### 5. Post-Deployment Verification

#### Health Checks
- [ ] Application loads successfully
- [ ] Authentication works
- [ ] DAW loads and functions
- [ ] AI generation works
- [ ] Social feed displays
- [ ] Real-time features work
- [ ] Audio playback works
- [ ] Project save/load works

#### Performance Checks
- [ ] Page load time < 3s
- [ ] API latency < 200ms
- [ ] Audio cache working
- [ ] Query cache working
- [ ] No console errors

#### Security Checks
- [ ] RLS policies enforcing correctly
- [ ] Rate limiting active
- [ ] CORS configured properly
- [ ] No exposed secrets
- [ ] HTTPS enforced

---

## Monitoring Setup

### Supabase Monitoring

Enable monitoring for:
1. Database queries
2. Edge function logs
3. Authentication events
4. Storage usage
5. Realtime connections

### External Monitoring

Recommended services:
- **Uptime**: UptimeRobot or Pingdom
- **Performance**: Google PageSpeed Insights
- **Errors**: Sentry
- **Analytics**: Google Analytics or Plausible

### Custom Monitoring

The platform includes built-in monitoring:

```typescript
// Access monitoring dashboard
// Navigate to: /admin → Monitoring tab

// View metrics:
- API latency by function
- Success/failure rates
- Cache performance
- Real-time connections
```

---

## Scaling Considerations

### Database
- **Connection Pooling**: Already implemented via DataSpace
- **Read Replicas**: Configure for high read loads
- **Caching**: Redis for frequently accessed data
- **Archiving**: Move old data to archive tables

### Edge Functions
- **Concurrency**: Configure per-function limits
- **Memory**: Increase for heavy operations
- **Timeouts**: Set appropriate limits
- **Rate Limits**: Adjust per usage patterns

### Storage
- **CDN**: Configure for audio files
- **Compression**: Enable for large files
- **Cleanup**: Implement automated cleanup
- **Backups**: Regular automated backups

### Frontend
- **Code Splitting**: Already implemented
- **Lazy Loading**: Already implemented
- **Bundle Size**: Monitor and optimize
- **CDN**: Serve static assets via CDN

---

## Backup Strategy

### Database Backups
```sql
-- Automated daily backups (Supabase)
-- Point-in-time recovery enabled

-- Manual backup
pg_dump -h db.mywijmtszelyutssormy.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql
```

### Storage Backups
- Configure automated bucket backups
- Sync to S3 or Google Cloud Storage
- Retention policy: 30 days minimum

### Code Backups
- Git repository with tags
- Docker images for each release
- Configuration files versioned

---

## Rollback Procedure

### Database Rollback
```sql
-- Revert last migration
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 5;

-- Apply down migration if available
-- Or restore from backup
```

### Application Rollback
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Manual: Deploy previous version
git checkout v1.0.0
npm run build
# Deploy dist/ folder
```

### Edge Functions Rollback
- Supabase automatically versions functions
- Navigate to Edge Functions dashboard
- Select function → View versions
- Deploy previous version

---

## Troubleshooting

### Common Issues

#### 1. "No customer found" in subscription check
**Cause**: User hasn't set up Stripe customer  
**Solution**: Ensure Stripe integration is configured properly

#### 2. RLS policy errors
**Cause**: User not authenticated or missing permissions  
**Solution**: Verify auth state and policy configuration

#### 3. Edge function timeouts
**Cause**: AI generation taking too long  
**Solution**: Increase function timeout or optimize request

#### 4. Real-time connection failures
**Cause**: Network issues or Supabase limits  
**Solution**: Check connection limits and network

#### 5. Audio cache not working
**Cause**: Storage quota exceeded  
**Solution**: Clear old cache or increase limit

### Debug Tools

```typescript
// Enable debug mode
localStorage.setItem('debug', 'true');

// View AuraBridge metrics
import { AuraBridge } from '@/lib/AuraBridge';
console.log(AuraBridge.getMetrics());

// View performance metrics
import { performanceMonitor } from '@/lib/PerformanceOptimizer';
console.log(performanceMonitor.getAllMetrics());

// View cache stats
import { audioCache, queryCache } from '@/lib/PerformanceOptimizer';
console.log('Audio:', audioCache.getStats());
console.log('Query:', queryCache.getStats());
```

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor error rates
- Check edge function logs
- Review performance metrics
- Verify backup completion

#### Weekly
- Review user feedback
- Analyze usage patterns
- Check storage usage
- Update dependencies (security)

#### Monthly
- Security audit
- Performance optimization
- Database maintenance
- Cost analysis

#### Quarterly
- Major dependency updates
- Feature planning
- Capacity planning
- Disaster recovery test

---

## Support Contacts

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

### API Providers
- **OpenAI**: https://platform.openai.com/docs
- **ElevenLabs**: https://elevenlabs.io/docs
- **Stripe**: https://stripe.com/docs

### Platform Support
- Documentation: `docs/`
- Issues: GitHub Issues
- Community: Discord Server
- Email: support@aurax.com

---

## Success Criteria

### Launch Checklist
- [ ] All health checks passing
- [ ] Zero critical errors
- [ ] Monitoring active
- [ ] Backups running
- [ ] Team trained
- [ ] Documentation complete
- [ ] Support channels ready
- [ ] Rollback plan tested

### Week 1 Goals
- [ ] 100 active users
- [ ] 95% uptime
- [ ] < 1% error rate
- [ ] < 2s page load time
- [ ] Positive user feedback

### Month 1 Goals
- [ ] 1,000 active users
- [ ] 99% uptime
- [ ] < 0.5% error rate
- [ ] < 1.5s page load time
- [ ] Feature adoption > 60%

---

*Deployment guide for Aura-X VAST Platform*  
*Version: 1.0*  
*Last Updated: October 2025*
