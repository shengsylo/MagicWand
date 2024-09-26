from livereload import Server, shell

server = Server()
server.watch('*.html') 
server.watch('*.js')
server.serve(host='::', port=7800)