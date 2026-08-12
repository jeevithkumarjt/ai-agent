FROM alpine:3.20
RUN apk add --no-cache curl
COPY keepalive.sh /usr/local/bin/keepalive.sh
RUN chmod +x /usr/local/bin/keepalive.sh
CMD ["/usr/local/bin/keepalive.sh"]
