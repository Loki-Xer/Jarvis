FROM quay.io/loki-xer/jarvis-md:latest
RUN git clone https://github.com/Loki-Xer/jarvis /root/jarvis/
WORKDIR /root/jarvis/
RUN yarn install --network-concurrency 1
CMD ["npm", "start"]
