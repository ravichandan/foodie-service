
FROM --platform=linux/amd64 node:20

ENV CHROME_BIN='/usr/bin/chromium-browser'


WORKDIR /foodie/work

LABEL stage=builder

ARG scriptsNames

COPY . /foodie/work

RUN rm -f node_modules package-lock.json dist
RUN npm i -f
RUN echo "before running webpack" && ls -la
RUN npm run webpack

RUN ls -la dist/


#COPY ./db-configurations/widgets/ ./projects/elements/configs/widgets/
#
#
#RUN for var in ${scriptsNames} ; \
#    do \
#      START_SECONDS=$(date +%s) ; \
#      if [[ $var == *"build:"* || $var == *"build-pack:"* ]]; then \
#        npm run $var || exit 1; \
#      fi ; \
#      END_SECONDS=$(date +%s) ; \
#      echo "--->log:: ===============> TIME LOG:: Ng build for $var took $((END_SECONDS-START_SECONDS)) seconds" ; \
#    done ;
#
