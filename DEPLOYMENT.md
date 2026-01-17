# Deployment Guide: Daily Task Planner

This guide explains how to deploy the Daily Task Planner application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up for a free account at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be stored in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Database**: For production, you'll need a PostgreSQL database (recommended). You can use:
   - Vercel Postgres (built-in)
   - Supabase
   - Neon
   - AWS RDS
   - Any other PostgreSQL provider

## Step 1: Configure Environment Variables

1. Copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required variables:
   - `DATABASE_URL`: Your PostgreSQL connection string

## Step 2: Deploy to Vercel

### Option 1: Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   vercel deploy
   ```

4. Follow the prompts:
   - Select your Vercel account
   - Choose a project name (or use default)
   - Configure the root directory (use `.`)
   - Configure build command (use `npm run build`)
   - Configure output directory (use `out`)

### Option 2: Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project settings:
   - Framework Preset: Next.js
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `out`
5. Add environment variables (see Step 1)
6. Click "Deploy"

## Step 3: Database Configuration

### Using Vercel Postgres

1. In your Vercel project, go to "Storage" tab
2. Click "Create" and select "Postgres"
3. Follow the setup wizard
4. Vercel will automatically add the `DATABASE_URL` environment variable
5. Run Prisma migrations:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

### Using External Database

1. Obtain your database connection string
2. Add it as `DATABASE_URL` environment variable in Vercel
3. Run Prisma migrations:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

## Step 4: Verify Deployment

1. After deployment completes, Vercel will provide a URL
2. Open the URL in your browser
3. Test the application functionality
4. Check the Vercel logs for any errors

## Production Best Practices

1. **Enable HTTPS**: Vercel automatically provides HTTPS
2. **Enable Preview Deployments**: For pull requests
3. **Set Up Custom Domain**: Add your own domain in Vercel settings
4. **Monitor Performance**: Use Vercel Analytics
5. **Set Up Alerts**: Configure deployment and performance alerts
6. **Regular Backups**: Ensure your database is backed up regularly

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check if `DATABASE_URL` is correct
   - Verify database server is accessible
   - Check firewall settings

2. **Build Failures**:
   - Check Prisma schema compatibility
   - Verify Node.js version
   - Check for missing dependencies

3. **Runtime Errors**:
   - Check Vercel logs
   - Verify environment variables
   - Check database connection

## Local Development

To run the application locally after deployment:

```bash
vercel dev
```

This will use the production environment variables from Vercel.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
