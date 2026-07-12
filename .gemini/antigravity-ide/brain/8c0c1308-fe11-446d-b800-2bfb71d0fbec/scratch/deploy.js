import { spawn } from 'child_process'

console.log('Spawning catalyst deploy --only functions and immediately closing stdin...')
const child = spawn('catalyst', ['deploy', '--only', 'functions'], {
  shell: true,
  stdio: ['pipe', 'inherit', 'inherit']
})

// Immediately close stdin to trigger the 'end' event with EOF
child.stdin.end()

child.on('exit', (code) => {
  console.log(`Process exited with code ${code}`)
})
