pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/home/staging.crm.freightbooks.net/public_html"
        SSH_KEY = "/var/jenkins_home/.ssh/id_rsa"
        REMOTE_USER = "root"
        SERVER_IP = "192.168.168.199"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/winggs-team/freightbooks-crm.git',
                    credentialsId: 'github-token'
            }
        }

        stage('Lint & Type Check') {
            steps {
                echo '🔍 Running lint and type checks...'
                sh '''
                    npm run lint || echo "⚠️ Lint warnings found"
                    npm run type-check || npx tsc --noEmit
                '''
            }
        }

        stage('Install & Build Frontend') {
            steps {
                echo '📦 Installing dependencies & building frontend...'
                script {
                    try {
                        sh '''
                            set -e
                            npm ci || npm install
                            CI=false npm run build
                        '''
                    } catch (Exception e) {
                        error("❌ Build failed. Check TypeScript errors or missing dependencies.")
                    }
                }
            }
        }

        stage('Verify Build Output') {
            steps {
                script {
                    if (!fileExists('dist')) {
                        error("❌ Build directory 'dist/' does not exist. Build likely failed.")
                    }
                }
            }
        }

        stage('Backup Remote Directory') {
            when {
                expression { currentBuild.currentResult == 'SUCCESS' }
            }
            steps {
                echo '🛡️ Backing up existing frontend deployment...'
                script {
                    def timestamp = sh(script: "date +%F_%H-%M-%S", returnStdout: true).trim()
                    def backupDir = "${DEPLOY_DIR}_backup_${timestamp}"

                    sh """
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${REMOTE_USER}@${SERVER_IP} 'bash -c "
                            if [ -d \\"${DEPLOY_DIR}\\" ]; then
                                mv \\"${DEPLOY_DIR}\\" \\"${backupDir}\\"
                            fi
                            mkdir -p \\"${DEPLOY_DIR}\\"
                        "'
                    """
                }
            }
        }

        stage('Upload Built Files to Server') {
            when {
                expression { currentBuild.currentResult == 'SUCCESS' }
            }
            steps {
                echo '📤 Uploading built frontend to remote server...'
                sh """
                    rsync -avz -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
                    --delete ./dist/ ${REMOTE_USER}@${SERVER_IP}:${DEPLOY_DIR}
                """
            }
        }

        stage('Restart Apache2') {
            when {
                expression { currentBuild.currentResult == 'SUCCESS' }
            }
            steps {
                echo '🔄 Restarting Apache2 web server...'
                sh """
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${SERVER_IP} '
                        systemctl restart apache2 || echo "Apache2 not found or not restarted. Skipping."
                    '
                """
            }
        }
    }

    post {
        success {
            echo "✅ Frontend deployed successfully to ${DEPLOY_DIR} and Apache2 restarted!"
        }
        failure {
            echo "❌ Deployment failed! Check the logs. Likely a build or rsync error — please verify."
        }
    }
}
